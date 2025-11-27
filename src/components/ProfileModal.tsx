import React, { useState, useCallback } from 'react';
import { X, Upload, Camera } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useUser } from '../contexts/UserContext';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, setUser } = useUser();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [password, setPassword] = useState('');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (): Promise<string> => {
    return new Promise((resolve) => {
      const image = new Image();
      image.src = imageSrc!;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
        
        resolve(canvas.toDataURL('image/jpeg'));
      };
    });
  };

  const handleCropSave = async () => {
    const croppedImage = await getCroppedImg();
    setPhotoUrl(croppedImage);
    setImageSrc(null);
  };

  const handleSave = async () => {
    try {
      const updateData: any = { name, email, phone };
      if (password) updateData.password = password;
      if (photoUrl !== user?.photoUrl) updateData.photoUrl = photoUrl;

      await updateDoc(doc(db, 'users', user!.id), updateData);
      setUser({ ...user!, ...updateData });
      alert('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Profile</h3>
          <button onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {imageSrc ? (
          <div className="mb-4">
            <div className="relative h-64 bg-gray-100">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="flex space-x-2 mt-2">
              <button onClick={handleCropSave} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg">
                Save Crop
              </button>
              <button onClick={() => setImageSrc(null)} className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-4">
            <div className="relative">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="h-24 w-24 rounded-full object-cover" />
              ) : (
                <div className="h-24 w-24 rounded-full bg-primary-500 flex items-center justify-center text-white text-3xl">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-primary-600 rounded-full p-2 cursor-pointer hover:bg-primary-700">
                <Camera className="h-4 w-4 text-white" />
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password (leave blank to keep current)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Enter new password"
            />
          </div>

          <button onClick={handleSave} className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
