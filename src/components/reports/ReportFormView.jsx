import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, Trash2, Upload } from 'lucide-react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Eye, Lock } from '../../lib/icons.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ReportFormView = ({ type }) => {
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const isLost = type === 'lost';

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const selectImage = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setImageError('Choose an image file to attach to this report.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Choose an image smaller than 10 MB.');
      return;
    }

    setImageError('');
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImage(null);
    setPreviewUrl('');
    setImageError('');
    if (galleryInputRef.current) galleryInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <FloatingPanel title={`Report ${isLost ? 'Lost' : 'Found'} Item`}>
        <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
          <section aria-label="Item photo" className="space-y-2">
            <div
              className={`overflow-hidden rounded-xl border ${imageError ? 'border-red-400/70' : 'border-[#6F4E37]/50'} bg-[#160D0A]/70`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectImage(event.dataTransfer.files?.[0]);
              }}
            >
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt={`Selected photo for ${isLost ? 'lost' : 'found'} item report`} className="h-48 w-full object-cover sm:h-60" />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#6F4E37]/50 bg-[#160D0A]/95 px-4 py-3">
                    <span className="min-w-0 truncate text-sm text-[#FAF9F8]">{image?.name}</span>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => galleryInputRef.current?.click()} className="rounded-lg border border-[#6F4E37]/60 px-3 py-2 text-xs font-medium text-[#E5E4E2] transition hover:border-[#E6E0F0]/60 hover:text-[#FAF9F8]">
                        Replace photo
                      </button>
                      <button type="button" onClick={clearImage} aria-label="Remove selected photo" className="rounded-lg border border-[#6F4E37]/60 p-2 text-[#E5E4E2] transition hover:border-red-400/60 hover:text-red-300">
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center px-5 py-7 text-center sm:min-h-52">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-full border border-[#C68B59]/40 bg-[#C68B59]/15 text-[#C68B59]">
                    <ImagePlus size={22} aria-hidden="true" />
                  </span>
                  <p className="font-semibold text-[#FAF9F8]">Add a photo of the {isLost ? 'item you lost' : 'item you found'}</p>
                  <p className="mt-1 text-sm text-[#E5E4E2]/75">Choose an image, take a photo, or drag one here. JPG, PNG, or other image files up to 10 MB.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => galleryInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-[#C68B59] px-4 py-2.5 text-sm font-semibold text-[#160D0A] transition hover:bg-[#D99A62]">
                      <Upload size={16} aria-hidden="true" /> Choose from device
                    </button>
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-[#6F4E37]/60 px-4 py-2.5 text-sm font-medium text-[#E5E4E2] transition hover:border-[#E6E0F0]/60 hover:text-[#FAF9F8]">
                      <Camera size={16} aria-hidden="true" /> Take a photo
                    </button>
                  </div>
                </div>
              )}
            </div>
            <input
              ref={galleryInputRef}
              className="sr-only"
              type="file"
              name="itemImage"
              accept="image/*"
              aria-label="Choose an item photo from your device"
              onChange={(event) => selectImage(event.target.files?.[0])}
            />
            <input
              ref={cameraInputRef}
              className="sr-only"
              type="file"
              accept="image/*"
              capture="environment"
              aria-label="Take a photo of the item"
              onChange={(event) => selectImage(event.target.files?.[0])}
            />
            {imageError && <p className="text-sm text-red-300" role="alert">{imageError}</p>}
          </section>

          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#E6E0F0]">
              <Eye size={16} /> Public Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Item name</label>
                <input type="text" placeholder="Example: blue water bottle" className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A]/70 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Visible description</label>
                <textarea placeholder="Describe its appearance, brand, or other visible details." className="h-24 w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A]/70 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Category</label>
                <select className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A] p-3 text-[#FAF9F8] transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40">
                  <option>Electronics</option><option>Water Bottles</option><option>Bags</option><option>Clothing &amp; Accessories</option><option>Keys &amp; IDs</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Main color</label>
                <input type="text" placeholder="Example: blue" className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A]/70 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40" />
              </div>
            </div>
          </div>

          <div className="relative space-y-4 overflow-hidden rounded-xl border border-[#6F4E37]/50 bg-[#160D0A]/70 p-4">
            <div className="absolute left-0 top-0 h-full w-1 bg-[#E6E0F0]" />
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#E6E0F0]">
              <Lock size={16} /> Private Ownership Clues
            </h3>
            <p className="text-xs leading-relaxed text-[#E5E4E2]/75">
              Add a detail that can help confirm the item is yours. Keep it out of the public description, such as a hidden mark, a unique contents detail, or a distinctive scratch.
            </p>
            <textarea placeholder="Add a private detail that only the owner would know." className="h-20 w-full rounded-lg border border-[#6F4E37]/40 bg-[#100805]/80 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40" />
          </div>

          <button className={`w-full rounded-xl py-4 font-semibold shadow-xl transition ${isLost ? 'bg-[#6F4E37] text-[#FAF9F8] hover:bg-[#8C5E43] border border-[#E5E4E2]/20' : 'bg-[#C68B59] text-[#160D0A] hover:bg-[#D99A62] border border-[#E5E4E2]/25'}`}>
            {isLost ? 'Submit lost-item report' : 'Submit found-item report'}
          </button>
        </form>
      </FloatingPanel>
    </div>
  );
};

export default ReportFormView;
