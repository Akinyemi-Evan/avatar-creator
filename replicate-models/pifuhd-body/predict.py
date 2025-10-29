import tempfile
import numpy as np
import torch
import cv2
from PIL import Image
from cog import BasePredictor, Input, Path
import sys
import os

sys.path.insert(0, '/src/pifuhd')

class Predictor(BasePredictor):
    def setup(self):
        """Load the PIFuHD model"""
        from lib.options import BaseOptions
        from lib.model.HGPIFuNet import HGPIFuNet
        from lib.mesh_util import reconstruction
        
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        # Load model
        opt = BaseOptions().parse()
        opt.load_netMR_checkpoint_path = '/src/pifuhd/checkpoints/pifuhd.pt'
        
        self.model = HGPIFuNet(opt, projection_mode='orthogonal')
        self.model.load_state_dict(torch.load(opt.load_netMR_checkpoint_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()
        
    def predict(
        self,
        image: Path = Input(description="Input person image (full body visible)"),
        resolution: int = Input(description="Mesh resolution", default=256, ge=128, le=512)
    ) -> Path:
        """Generate 3D body mesh from image"""
        
        # Load and preprocess image
        img = Image.open(str(image)).convert('RGB')
        img_np = np.array(img)
        
        # Resize to square
        h, w = img_np.shape[:2]
        size = max(h, w)
        img_padded = np.zeros((size, size, 3), dtype=np.uint8)
        y_offset = (size - h) // 2
        x_offset = (size - w) // 2
        img_padded[y_offset:y_offset+h, x_offset:x_offset+w] = img_np
        
        # Resize to 512x512
        img_resized = cv2.resize(img_padded, (512, 512))
        
        # Normalize
        img_tensor = torch.from_numpy(img_resized).float().permute(2, 0, 1) / 255.0
        img_tensor = (img_tensor - 0.5) * 2.0  # Normalize to [-1, 1]
        img_tensor = img_tensor.unsqueeze(0).to(self.device)
        
        # Run PIFuHD
        with torch.no_grad():
            from lib.mesh_util import reconstruction
            verts, faces, _, _ = reconstruction(
                self.model, 
                img_tensor, 
                resolution=resolution,
                use_octree=True
            )
        
        # Create mesh
        import trimesh
        mesh = trimesh.Trimesh(vertices=verts, faces=faces, process=False)
        
        # Export to OBJ
        obj_file = tempfile.NamedTemporaryFile(suffix='.obj', delete=False)
        mesh.export(obj_file.name)
        
        return Path(obj_file.name)
