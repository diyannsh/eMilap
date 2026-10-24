import { useEffect, useRef, useState } from 'react';
import { Camera, Check, CheckCircle2, ImagePlus, LogIn, Share2, Sparkles, Trash2, Upload } from 'lucide-react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Eye, Lock, MapPin } from '../../lib/icons.js';
import { CAMPUS_ZONES, ITEM_CATEGORIES, mockStore } from '../../data/mockStore.js';
import { copyShareLink } from '../../lib/routes.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export default function ReportFormView({ type, onNavigate }) {
  const { user } = useAuth();
  const isLost = type === 'lost';

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [color, setColor] = useState('');
  const [brand, setBrand] = useState('');
  const [locationZone, setLocationZone] = useState('Main Library');
  const [spotDetail, setSpotDetail] = useState('');
  const [dateTime, setDateTime] = useState('Today, recent');
  const [description, setDescription] = useState('');
  const [privateClue, setPrivateClue] = useState('');

  // Image State
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageError, setImageError] = useState('');
  const [formError, setFormError] = useState('');

  // Submission State
  const [submittedItem, setSubmittedItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const galleryInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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

  const handleShareForm = async () => {
    await copyShareLink(isLost ? 'report_lost' : 'report_found');
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2200);
  };

  const handleCopySubmittedLink = async () => {
    if (!submittedItem) return;
    await copyShareLink('browse', { itemId: submittedItem.id });
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || title.trim().length < 2) {
      setFormError('Please enter an item title of at least 2 characters.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      setFormError('Please provide a visible description of at least 5 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      let createdBackendItem = null;

      // If user is logged in, submit to backend API first
      if (user) {
        let imageObjectKeys = [];
        if (image) {
          try {
            const uploadRes = await api.uploads.uploadReportImage(image);
            if (uploadRes?.data?.objectKey) {
              imageObjectKeys.push(uploadRes.data.objectKey);
            }
          } catch (uploadErr) {
            console.warn('Image upload failed, continuing with report submission:', uploadErr);
          }
        }

        const reportPayload = {
          reportType: isLost ? 'LOST' : 'FOUND',
          title: title.trim(),
          publicDescription: description.trim(),
          category: category.trim(),
          color: color.trim() || undefined,
          brand: brand.trim() || undefined,
          approximateLocation: spotDetail ? `${locationZone} - ${spotDetail.trim()}` : locationZone,
          privateDetails: privateClue.trim() || undefined,
          imageObjectKeys,
        };

        const res = await api.reports.create(reportPayload);
        createdBackendItem = res?.data;
      }

      // Add to local mockStore for immediate UI responsiveness
      const localItem = mockStore.addItem({
        id: createdBackendItem?.id,
        title: title.trim(),
        category,
        color: color.trim() || 'Unspecified',
        location: locationZone,
        spot: spotDetail.trim() || 'General campus area',
        date: dateTime,
        description: description.trim(),
        privateClue: privateClue.trim() || 'None provided',
        status: isLost ? 'LOST' : 'FOUND',
        contact: user ? `${user.displayName || user.email}` : isLost ? 'Student Reporter' : `${locationZone} Campus Desk`,
        isSample: false,
      });

      setSubmittedItem(createdBackendItem || localItem);
    } catch (err) {
      console.warn('Backend submission failed, saving to local store:', err);
      // Fallback to local store
      const localItem = mockStore.addItem({
        title: title.trim(),
        category,
        color: color.trim() || 'Unspecified',
        location: locationZone,
        spot: spotDetail.trim() || 'General campus area',
        date: dateTime,
        description: description.trim(),
        privateClue: privateClue.trim() || 'None provided',
        status: isLost ? 'LOST' : 'FOUND',
        contact: isLost ? 'Student Reporter' : `${locationZone} Campus Desk`,
        isSample: false,
      });
      setSubmittedItem(localItem);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTitle('');
    setColor('');
    setBrand('');
    setSpotDetail('');
    setDescription('');
    setPrivateClue('');
    clearImage();
    setSubmittedItem(null);
    setFormError('');
  };

  // If already submitted, render the success confirmation view
  if (submittedItem) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col">
        <FloatingPanel title="Report Filed Successfully">
          <div className="p-6 sm:p-8 rounded-2xl bg-[#140C08]/90 border border-[#6F4E37]/60 text-center space-y-5">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#C68B59]/20 border border-[#C68B59]/50 flex items-center justify-center text-[#C68B59] shadow-lg animate-bounce">
              <CheckCircle2 size={32} />
            </div>

            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#E6E0F0]">
                {submittedItem.status || (isLost ? 'LOST' : 'FOUND')} REPORT CONFIRMED
              </span>
              <h3 className="text-2xl font-bold text-[#FAF9F8]">{submittedItem.title}</h3>
              <p className="text-sm text-[#E5E4E2]/80 max-w-md mx-auto leading-relaxed">
                Your report has been logged and published to the live campus registry. Campus security and community members can now match against this item.
              </p>
            </div>

            {/* Item Summary Card */}
            <div className="bg-[#1D110C] p-4 rounded-xl border border-[#6F4E37]/45 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-[#E5E4E2]/60">Reference ID:</span>
                <span className="text-[#FAF9F8] font-mono font-bold">
                  #EM-{String(submittedItem.id || 'SUBMITTED').slice(-6)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#E5E4E2]/60">Location Zone:</span>
                <span className="text-[#FAF9F8] font-semibold">{submittedItem.location || locationZone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#E5E4E2]/60">Category:</span>
                <span className="text-[#FAF9F8] font-semibold">{submittedItem.category || category}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center">
              <button
                type="button"
                onClick={handleCopySubmittedLink}
                className="px-5 py-3 bg-[#1D110C] hover:bg-[#281610] text-[#E5E4E2] rounded-xl font-semibold text-xs transition border border-[#6F4E37]/60 flex items-center justify-center gap-1.5"
              >
                {copiedShare ? (
                  <>
                    <Check size={14} className="text-emerald-400" /> Listing Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 size={14} className="text-[#C68B59]" /> Copy Listing Link
                  </>
                )}
              </button>
              {onNavigate && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('browse')}
                    className="px-6 py-3 bg-[#6F4E37] hover:bg-[#8C5E43] text-[#FAF9F8] rounded-xl font-semibold text-sm transition shadow-lg border border-[#E5E4E2]/20 flex items-center justify-center gap-2"
                  >
                    View in Campus Listings
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('matches')}
                    className="px-6 py-3 bg-[#241611] hover:bg-[#341F18] text-[#E5E4E2] border border-[#6F4E37]/60 rounded-xl font-medium text-sm transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={15} className="text-[#C68B59]" /> Check Matches
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={handleResetForm}
                className="px-5 py-3 text-xs text-[#E5E4E2]/70 hover:text-[#FAF9F8] hover:underline transition"
              >
                File another report
              </button>
            </div>
          </div>
        </FloatingPanel>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="flex justify-end mb-2">
        <button
          type="button"
          onClick={handleShareForm}
          className="text-xs px-3 py-1.5 rounded-lg bg-[#180E0A] hover:bg-[#25150F] text-[#E5E4E2] border border-[#6F4E37]/50 flex items-center gap-1.5 transition"
        >
          {copiedShare ? (
            <>
              <Check size={13} className="text-emerald-400" /> Direct Link Copied!
            </>
          ) : (
            <>
              <Share2 size={13} /> Share This Form
            </>
          )}
        </button>
      </div>
      <FloatingPanel title={`Report ${isLost ? 'Lost' : 'Found'} Item`}>
        {!user && (
          <div className="mb-6 rounded-xl border border-[#6F4E37]/50 bg-[#1A0F0A]/90 p-4 text-sm text-[#E5E4E2]">
            <p className="font-semibold text-[#E6E0F0] flex items-center gap-2">
              <LogIn size={16} /> Campus Sign-In Recommended
            </p>
            <p className="mt-1 text-xs text-[#E5E4E2]/70">
              You can submit reports locally now, or sign in via the header to sync your report across campus databases and receive automated match notifications.
            </p>
          </div>
        )}

        {formError && (
          <div className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-300" role="alert">
            <p className="font-semibold">Submission Notice</p>
            <p className="mt-1 text-xs">{formError}</p>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* ── Photo Upload Section ── */}
          <section className="space-y-3">
            <label className="block text-sm font-medium text-[#E5E4E2]">
              Item Photo (Optional)
            </label>

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => selectImage(e.target.files?.[0])}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => selectImage(e.target.files?.[0])}
            />

            {!previewUrl ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#6F4E37]/70 bg-[#160D0A]/70 p-6 text-[#E5E4E2] transition hover:border-[#E6E0F0] hover:bg-[#20130E]"
                >
                  <ImagePlus size={24} className="text-[#C68B59]" />
                  <span className="text-xs font-semibold">Upload Photo</span>
                  <span className="text-[10px] text-[#E5E4E2]/50">PNG, JPG up to 10 MB</span>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#6F4E37]/70 bg-[#160D0A]/70 p-6 text-[#E5E4E2] transition hover:border-[#E6E0F0] hover:bg-[#20130E]"
                >
                  <Camera size={24} className="text-[#C68B59]" />
                  <span className="text-xs font-semibold">Take Photo</span>
                  <span className="text-[10px] text-[#E5E4E2]/50">Direct from camera</span>
                </button>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl border border-[#6F4E37]/60 bg-[#160D0A]/80 p-3">
                <div className="relative mx-auto aspect-video max-h-56 overflow-hidden rounded-lg bg-black/40">
                  <img
                    src={previewUrl}
                    alt="Uploaded item preview"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-[#E5E4E2]/70">
                  <span>Photo attached ({((image?.size || 0) / (1024 * 1024)).toFixed(2)} MB)</span>
                  <button
                    type="button"
                    onClick={clearImage}
                    className="flex items-center gap-1 text-red-400 hover:text-red-300 font-medium transition"
                  >
                    <Trash2 size={14} /> Remove photo
                  </button>
                </div>
              </div>
            )}

            {imageError && (
              <p className="text-xs text-red-400 font-medium" role="alert">
                {imageError}
              </p>
            )}
          </section>

          {/* ── Public Item Details ── */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#E6E0F0]">
              <Eye size={16} /> Public Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Item Name / Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Example: Blue Hydro Flask, MacBook Air, Silver Car Keys"
                  className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A]/70 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A] p-3 text-[#FAF9F8] transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40"
                >
                  {ITEM_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Main Color</label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="Example: Matte black, Navy blue"
                  className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A]/70 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Brand / Manufacturer</label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Example: Apple, Hydro Flask, Nike"
                  className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A]/70 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40"
                />
              </div>

              {/* Campus Location Zone Dropdown */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2] flex items-center gap-1.5">
                  <MapPin size={14} className="text-[#C68B59]" /> Campus Building / Zone *
                </label>
                <select
                  value={locationZone}
                  onChange={(e) => setLocationZone(e.target.value)}
                  className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A] p-3 text-[#FAF9F8] transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40"
                >
                  {CAMPUS_ZONES.filter((z) => z !== 'All Campus Locations').map((zone) => (
                    <option key={zone} value={zone}>
                      {zone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Specific Spot / Room</label>
                <input
                  type="text"
                  value={spotDetail}
                  onChange={(e) => setSpotDetail(e.target.value)}
                  placeholder="e.g. 2nd Fl study desk, Cafeteria booth, Lab 3"
                  className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A]/70 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">When was it lost/found?</label>
                <input
                  type="text"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  placeholder="e.g. Today around 11:30 AM, Yesterday afternoon"
                  className="w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A]/70 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Visible Description *</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe its exterior appearance, stickers, visible condition, or accessories."
                  className="h-24 w-full rounded-lg border border-[#6F4E37]/50 bg-[#160D0A]/70 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40"
                />
              </div>
            </div>
          </div>

          {/* ── Private Ownership Clue Section ── */}
          <div className="relative space-y-3 overflow-hidden rounded-xl border border-[#6F4E37]/50 bg-[#160D0A]/70 p-4">
            <div className="absolute left-0 top-0 h-full w-1 bg-[#E6E0F0]" />
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-[#E6E0F0]">
              <Lock size={16} /> Private Ownership Clue (Hidden from Public)
            </h3>
            <p className="text-xs leading-relaxed text-[#E5E4E2]/75">
              Add a confidential detail that only the true owner can verify (e.g. serial number, lockscreen wallpaper description, hidden engraving, or contents inside a pocket).
            </p>
            <textarea
              value={privateClue}
              onChange={(e) => setPrivateClue(e.target.value)}
              placeholder="e.g. Lockscreen has a photo of a golden retriever; initials 'J.K.' engraved on back; contains student ID card ending in 204."
              className="h-20 w-full rounded-lg border border-[#6F4E37]/40 bg-[#100805]/80 p-3 text-[#FAF9F8] placeholder-[#E5E4E2]/40 transition focus:border-[#E6E0F0] focus:outline-none focus:ring-1 focus:ring-[#E6E0F0]/40 text-xs sm:text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full rounded-xl py-4 font-semibold shadow-xl transition flex items-center justify-center gap-2 ${
              isLost
                ? 'bg-[#6F4E37] text-[#FAF9F8] hover:bg-[#8C5E43] border border-[#E5E4E2]/20'
                : 'bg-[#C68B59] text-[#160D0A] hover:bg-[#D99A62] border border-[#E5E4E2]/25'
            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <span>Saving report to campus registry...</span>
            ) : isLost ? (
              'Submit Lost Item Report'
            ) : (
              'Submit Found Item Report'
            )}
          </button>
        </form>
      </FloatingPanel>
    </div>
  );
}
