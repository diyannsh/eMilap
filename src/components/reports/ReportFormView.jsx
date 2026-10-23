import { useEffect, useRef, useState } from 'react';
import { Camera, Check, CheckCircle2, ImagePlus, Share2, Sparkles, Trash2, Upload } from 'lucide-react';
import FloatingPanel from '../ui/FloatingPanel.jsx';
import { Eye, Lock, MapPin } from '../../lib/icons.js';
import { CAMPUS_ZONES, ITEM_CATEGORIES, mockStore } from '../../data/mockStore.js';
import { copyShareLink } from '../../lib/routes.js';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export default function ReportFormView({ type, onNavigate }) {
  const isLost = type === 'lost';

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [color, setColor] = useState('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Please enter an item title or name.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide a brief visible description of the item.');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const created = mockStore.addItem({
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

      setIsSubmitting(false);
      setSubmittedItem(created);
    }, 450);
  };

  const handleResetForm = () => {
    setTitle('');
    setColor('');
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
                {submittedItem.status} REPORT CONFIRMED
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
                <span className="text-[#FAF9F8] font-mono font-bold">#EM-{submittedItem.id.slice(-6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#E5E4E2]/60">Location Zone:</span>
                <span className="text-[#FAF9F8] font-semibold">{submittedItem.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#E5E4E2]/60">Category:</span>
                <span className="text-[#FAF9F8] font-semibold">{submittedItem.category}</span>
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
        <form className="space-y-6" onSubmit={handleSubmit}>
          {formError && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-xs text-red-200" role="alert">
              {formError}
            </div>
          )}

          {/* ── Photo Upload Section ── */}
          <section aria-label="Item photo" className="space-y-2">
            <div
              className={`overflow-hidden rounded-xl border ${
                imageError ? 'border-red-400/70' : 'border-[#6F4E37]/50'
              } bg-[#160D0A]/70`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                selectImage(event.dataTransfer.files?.[0]);
              }}
            >
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt={`Selected photo for ${isLost ? 'lost' : 'found'} item report`}
                    className="h-48 w-full object-cover sm:h-60"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#6F4E37]/50 bg-[#160D0A]/95 px-4 py-3">
                    <span className="min-w-0 truncate text-sm text-[#FAF9F8]">{image?.name}</span>
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="rounded-lg border border-[#6F4E37]/60 px-3 py-2 text-xs font-medium text-[#E5E4E2] transition hover:border-[#E6E0F0]/60 hover:text-[#FAF9F8]"
                      >
                        Replace photo
                      </button>
                      <button
                        type="button"
                        onClick={clearImage}
                        aria-label="Remove selected photo"
                        className="rounded-lg border border-[#6F4E37]/60 p-2 text-[#E5E4E2] transition hover:border-red-400/60 hover:text-red-300"
                      >
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
                  <p className="font-semibold text-[#FAF9F8]">
                    Add a photo of the {isLost ? 'item you lost' : 'item you found'}
                  </p>
                  <p className="mt-1 text-sm text-[#E5E4E2]/75">
                    Choose an image, take a photo, or drag one here. JPG, PNG, or other image files up to 10 MB.
                  </p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#C68B59] px-4 py-2.5 text-sm font-semibold text-[#160D0A] transition hover:bg-[#D99A62]"
                    >
                      <Upload size={16} aria-hidden="true" /> Choose from device
                    </button>
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#6F4E37]/60 px-4 py-2.5 text-sm font-medium text-[#E5E4E2] transition hover:border-[#E6E0F0]/60 hover:text-[#FAF9F8]"
                    >
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
            {imageError && (
              <p className="text-sm text-red-300" role="alert">
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

              <div>
                <label className="mb-1 block text-sm font-medium text-[#E5E4E2]">Specific Spot / Room</label>
                <input
                  type="text"
                  value={spotDetail}
                  onChange={(e) => setSpotDetail(e.target.value)}
                  placeholder="e.g. 2nd Fl study desk, Cafeteria booth"
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
                  placeholder="Describe its exterior appearance, brand, stickers, visible condition, or accessories."
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
