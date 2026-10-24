import { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ImagePlus, LogIn, Trash2, Upload } from 'lucide-react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Eye, Lock } from '../../lib/icons.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const ReportFormView = ({ type }) => {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const isLost = type === 'lost';

  // Form field states
  const [title, setTitle] = useState('');
  const [publicDescription, setPublicDescription] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [approximateLocation, setApproximateLocation] = useState('');
  const [privateClues, setPrivateClues] = useState('');

  // Submission state
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successData, setSuccessData] = useState(null);

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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessData(null);

    if (!user) {
      setErrorMessage('Please sign in before submitting a report.');
      return;
    }

    if (!title.trim() || title.trim().length < 2) {
      setErrorMessage('Please provide an item name of at least 2 characters.');
      return;
    }
    if (!publicDescription.trim() || publicDescription.trim().length < 5) {
      setErrorMessage('Please provide a visible description of at least 5 characters.');
      return;
    }

    setLoading(true);
    try {
      let imageObjectKeys = [];
      if (image) {
        const uploadRes = await api.uploads.uploadReportImage(image);
        if (uploadRes?.data?.objectKey) {
          imageObjectKeys.push(uploadRes.data.objectKey);
        }
      }

      const reportPayload = {
        reportType: isLost ? 'LOST' : 'FOUND',
        title: title.trim(),
        publicDescription: publicDescription.trim(),
        category: category.trim(),
        color: color.trim() || undefined,
        brand: brand.trim() || undefined,
        approximateLocation: approximateLocation.trim() || undefined,
        privateDetails: privateClues.trim() || undefined,
        imageObjectKeys,
      };

      const res = await api.reports.create(reportPayload);
      setSuccessData(res.data);

      // Reset fields
      setTitle('');
      setPublicDescription('');
      setColor('');
      setBrand('');
      setApproximateLocation('');
      setPrivateClues('');
      clearImage();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit report. Please check the fields and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col pointer-events-none">
      <FloatingPanel title={`Report ${isLost ? 'Lost' : 'Found'} Item`} className="pointer-events-auto">
        {!user && (
          <div className="mb-6 rounded-xl border border-signal-500/30 bg-signal-500/10 p-4 text-sm text-platinum-400">
            <p className="font-semibold text-signal-300 flex items-center gap-2">
              <LogIn size={16} /> Sign-in required
            </p>
            <p className="mt-1 text-xs text-platinum-500">
              You must be logged in to create campus lost and found reports. Please click the account button in the header to sign in or create an account.
            </p>
          </div>
        )}

        {successData && (
          <div className="mb-6 rounded-xl border border-signal-400/40 bg-signal-500/15 p-4 text-sm text-signal-200">
            <p className="font-semibold flex items-center gap-2 text-signal-300">
              <CheckCircle2 size={18} /> Report submitted successfully!
            </p>
            <p className="mt-1 text-xs text-platinum-400">
              Your {isLost ? 'lost' : 'found'} report has been saved to the campus directory. Matching algorithms have queued this item for suggestions.
            </p>
            <p className="mt-2 text-[11px] font-mono text-platinum-500/80">ID: {successData.id}</p>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-300" role="alert">
            <p className="font-semibold">Submission Error</p>
            <p className="mt-1 text-xs">{errorMessage}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <section aria-label="Item photo" className="space-y-2">
            <div
              className={`overflow-hidden rounded-xl border ${imageError ? 'border-red-400/70' : 'border-mocha-700/70'} bg-mocha-900/50`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectImage(event.dataTransfer.files?.[0]);
              }}
            >
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt={`Selected photo for ${isLost ? 'lost' : 'found'} item report`} className="h-48 w-full object-cover sm:h-60" />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mocha-700/70 bg-mocha-900/90 px-4 py-3">
                    <span className="min-w-0 truncate text-sm text-platinum-400">{image?.name}</span>
                    <div className="flex shrink-0 gap-2">
                      <button type="button" onClick={() => galleryInputRef.current?.click()} className="rounded-lg border border-mocha-700 px-3 py-2 text-xs font-medium text-platinum-400 transition hover:border-lavender-400/60">
                        Replace photo
                      </button>
                      <button type="button" onClick={clearImage} aria-label="Remove selected photo" className="rounded-lg border border-mocha-700 p-2 text-platinum-400 transition hover:border-red-400/60 hover:text-red-200">
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center px-5 py-7 text-center sm:min-h-52">
                  <span className="mb-3 grid h-12 w-12 place-items-center rounded-full border border-caramel-500/30 bg-caramel-500/10 text-caramel-300">
                    <ImagePlus size={22} aria-hidden="true" />
                  </span>
                  <p className="font-semibold text-platinum-400">Add a photo of the {isLost ? 'item you lost' : 'item you found'}</p>
                  <p className="mt-1 text-sm text-platinum-500/75">Choose an image, take a photo, or drag one here. JPG, PNG, or other image files up to 10 MB.</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={() => galleryInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-caramel-500 px-4 py-2.5 text-sm font-semibold text-[#1E1310] transition hover:bg-caramel-400">
                      <Upload size={16} aria-hidden="true" /> Choose from device
                    </button>
                    <button type="button" onClick={() => cameraInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-mocha-700 px-4 py-2.5 text-sm font-medium text-platinum-400 transition hover:border-caramel-500/60">
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
            <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-platinum-500">
              <Eye size={16} /> Public Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="mb-1 block text-sm text-platinum-500">Item name *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: blue water bottle"
                  required
                  className="w-full rounded-lg border border-mocha-700 bg-mocha-800 p-3 text-platinum-400 transition focus:border-lavender-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-sm text-platinum-500">Visible description *</label>
                <textarea
                  value={publicDescription}
                  onChange={(e) => setPublicDescription(e.target.value)}
                  placeholder="Describe its appearance, brand, or other visible details."
                  required
                  className="h-24 w-full rounded-lg border border-mocha-700 bg-mocha-800 p-3 text-platinum-400 transition focus:border-lavender-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-platinum-500">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-mocha-700 bg-mocha-800 p-3 text-platinum-400 transition focus:border-lavender-500 focus:outline-none"
                >
                  <option value="Electronics">Electronics</option>
                  <option value="Water Bottles">Water Bottles</option>
                  <option value="Bags">Bags</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Books">Books</option>
                  <option value="Keys">Keys</option>
                  <option value="Wallets">Wallets</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-platinum-500">Main color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Example: blue"
                  className="w-full rounded-lg border border-mocha-700 bg-mocha-800 p-3 text-platinum-400 transition focus:border-lavender-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-platinum-500">Brand / Manufacturer</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Example: Apple, Hydro Flask"
                  className="w-full rounded-lg border border-mocha-700 bg-mocha-800 p-3 text-platinum-400 transition focus:border-lavender-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-platinum-500">Approximate location</label>
                <input
                  type="text"
                  value={approximateLocation}
                  onChange={(e) => setApproximateLocation(e.target.value)}
                  placeholder="Example: Library 2nd floor"
                  className="w-full rounded-lg border border-mocha-700 bg-mocha-800 p-3 text-platinum-400 transition focus:border-lavender-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="relative space-y-4 overflow-hidden rounded-xl border border-mocha-700/50 bg-mocha-800/50 p-4">
            <div className="absolute left-0 top-0 h-full w-1 bg-platinum-500" />
            <h3 className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-platinum-500">
              <Lock size={16} /> Private Ownership Clues
            </h3>
            <p className="text-xs leading-relaxed text-platinum-500">
              Add a detail that can help confirm the item is yours. Keep it out of the public description, such as a hidden mark, a unique contents detail, or a distinctive scratch. Stored encrypted and separate.
            </p>
            <textarea
              value={privateClues}
              onChange={(e) => setPrivateClues(e.target.value)}
              placeholder="Add a private detail that only the owner would know."
              className="h-20 w-full rounded-lg border border-mocha-700 bg-mocha-900/50 p-3 text-platinum-400 transition focus:border-platinum-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !user}
            className={`w-full rounded-xl py-4 font-medium shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isLost
                ? 'bg-lavender-600 text-white hover:bg-lavender-500'
                : 'bg-signal-500 text-[#111113] hover:bg-signal-400'
            }`}
          >
            {loading ? 'Submitting report...' : isLost ? 'Submit lost-item report' : 'Submit found-item report'}
          </button>
        </form>
      </FloatingPanel>
    </div>
  );
};

export default ReportFormView;
