import tempfile
import numpy as np
import torch
import cv2
from PIL import Image
from cog import BasePredictor, Input, Path
import trimesh
import base64
import io

class Predictor(BasePredictor):
    def setup(self):
        """Load the DECA model"""
        from decalib.deca import DECA
        from decalib.utils.config import cfg as deca_cfg
        
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        deca_cfg.model.use_tex = True
        deca_cfg.rasterizer_type = 'pytorch3d'
        deca_cfg.model.extract_tex = True
        
        self.deca = DECA(config=deca_cfg, device=self.device)

    def predict(
        self,
        image: Path = Input(description="Input face image"),
    ) -> dict:
        """Generate 3D face mesh and texture from image"""
        
        # Load image
        img = cv2.imread(str(image))
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Detect face
        from decalib.utils.detector import FAN
        face_detector = FAN()
        bbox, bbox_type = face_detector.run(img)
        
        if bbox is None:
            raise ValueError("No face detected in image")
        
        # Crop and resize face
        left = bbox[0]; right = bbox[2]
        top = bbox[1]; bottom = bbox[3]
        old_size = max(right - left, bottom - top)
        center = np.array([right - (right - left) / 2.0, bottom - (bottom - top) / 2.0])
        size = int(old_size * 1.5)
        
        src_pts = np.array([
            [center[0]-size/2, center[1]-size/2],
            [center[0]-size/2, center[1]+size/2],
            [center[0]+size/2, center[1]-size/2]
        ])
        DST_PTS = np.array([[0, 0], [0, 223], [223, 0]])
        tform = cv2.getAffineTransform(src_pts, DST_PTS)
        face_img = cv2.warpAffine(img, tform, (224, 224))
        
        # Convert to tensor
        face_tensor = torch.tensor(face_img).permute(2, 0, 1).unsqueeze(0).float() / 255.0
        face_tensor = face_tensor.to(self.device)
        
        # Run DECA
        with torch.no_grad():
            codedict = self.deca.encode(face_tensor)
            opdict = self.deca.decode(codedict)
            
        # Extract mesh
        vertices = opdict['verts'][0].cpu().numpy()
        faces = self.deca.flame.faces_tensor.cpu().numpy()
        
        # Create mesh
        mesh = trimesh.Trimesh(vertices=vertices, faces=faces, process=False)
        
        # Export mesh to OBJ
        obj_file = tempfile.NamedTemporaryFile(suffix='.obj', delete=False)
        mesh.export(obj_file.name)
        
        # Extract texture
        texture = opdict['uv_texture_gt'][0].permute(1, 2, 0).cpu().numpy()
        texture = (texture * 255).astype(np.uint8)
        texture_img = Image.fromarray(texture)
        
        # Export texture to PNG
        texture_file = tempfile.NamedTemporaryFile(suffix='.png', delete=False)
        texture_img.save(texture_file.name)
        
        return {
            "mesh": Path(obj_file.name),
            "texture": Path(texture_file.name)
        }
