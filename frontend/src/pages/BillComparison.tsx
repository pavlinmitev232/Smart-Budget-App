import React, { useState, useCallback, useEffect } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  FileText,
  Check,
  Loader2,
  History,
  ChevronRight,
  Clock,
  Eye,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';
import ComparisonResults from '../components/bill-comparison/ComparisonResults';

interface UploadedImage {
  id: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  previewUrl?: string;
}

interface ComparisonLimits {
  tier: string;
  dailyLimit: number | string;
  usedToday: number;
  remaining: number | string;
  canCreate: boolean;
}

interface Comparison {
  id: number;
  title: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultSummary: string | null;
  resultData: any | null;
  createdAt: string;
  completedAt: string | null;
}

type ViewMode = 'upload' | 'history' | 'result';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

const BillComparison: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [limits, setLimits] = useState<ComparisonLimits | null>(null);
  const [loading, setLoading] = useState(true);

  // Comparison history state
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Active comparison result state
  const [activeComparison, setActiveComparison] = useState<Comparison | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Fetch limits and existing images on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [limitsRes, imagesRes] = await Promise.all([
          api.get('/bill-comparison/limits'),
          api.get('/bill-comparison/images'),
        ]);
        setLimits(limitsRes.data.data);
        setUploadedImages(imagesRes.data.data.images);
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load bill comparison data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch comparison history
  const fetchComparisons = async () => {
    setLoadingHistory(true);
    try {
      const response = await api.get('/bill-comparison/comparisons?limit=20');
      setComparisons(response.data.data.comparisons);
    } catch (error) {
      console.error('Failed to fetch comparisons:', error);
      toast.error('Failed to load comparison history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle file validation
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only JPG and PNG are allowed.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 5MB.';
    }
    return null;
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle file upload
  const handleUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        toast.error(`${file.name}: ${error}`);
        continue;
      }

      try {
        setUploading(true);
        setUploadProgress(0);

        const base64 = await fileToBase64(file);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90));
        }, 100);

        const response = await api.post('/bill-comparison/upload', {
          imageData: base64,
          fileName: file.name,
          mimeType: file.type,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        const newImage: UploadedImage = {
          ...response.data.data.image,
          previewUrl: base64,
        };

        setUploadedImages((prev) => [newImage, ...prev]);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(error.response?.data?.error?.message || 'Failed to upload image');
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleUpload(files);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUpload(files);
    }
    // Reset input
    e.target.value = '';
  };

  // Handle image selection for comparison
  const toggleImageSelection = (imageId: number) => {
    setSelectedImages((prev) => {
      if (prev.includes(imageId)) {
        return prev.filter((id) => id !== imageId);
      }
      if (prev.length >= 2) {
        toast.warning('You can only select 2 images for comparison');
        return prev;
      }
      return [...prev, imageId];
    });
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId: number) => {
    try {
      await api.delete(`/bill-comparison/images/${imageId}`);
      setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
      setSelectedImages((prev) => prev.filter((id) => id !== imageId));
      toast.success('Image deleted');
    } catch (error) {
      toast.error('Failed to delete image');
    }
  };

  // Handle comparison creation and analysis
  const handleCreateComparison = async () => {
    if (selectedImages.length !== 2) {
      toast.warning('Please select exactly 2 images to compare');
      return;
    }

    if (limits && !limits.canCreate) {
      toast.error('Daily comparison limit reached. Upgrade your plan for more comparisons.');
      return;
    }

    try {
      // Step 1: Create the comparison
      const response = await api.post('/bill-comparison/compare', {
        imageIds: selectedImages,
        title: `Comparison ${new Date().toLocaleDateString()}`,
      });

      const comparison = response.data.data.comparison;
      toast.info('Comparison created! Starting AI analysis...');

      // Remove images from unassigned list
      setUploadedImages((prev) =>
        prev.filter((img) => !selectedImages.includes(img.id))
      );
      setSelectedImages([]);

      // Switch to result view and start analysis
      setActiveComparison(comparison);
      setViewMode('result');
      setAnalyzing(true);
      setAnalysisError(null);

      // Step 2: Trigger AI analysis
      try {
        const analyzeResponse = await api.post(`/bill-comparison/comparisons/${comparison.id}/analyze`);
        const updatedComparison = {
          ...comparison,
          status: 'completed',
          resultData: analyzeResponse.data.data.comparison.resultData,
          resultSummary: analyzeResponse.data.data.comparison.resultSummary,
        };
        setActiveComparison(updatedComparison);
        toast.success('AI analysis completed!');
      } catch (analyzeError: any) {
        console.error('Analysis error:', analyzeError);
        setAnalysisError(analyzeError.response?.data?.error?.message || 'AI analysis failed. Please try again.');
      } finally {
        setAnalyzing(false);
      }

      // Refresh limits
      const limitsRes = await api.get('/bill-comparison/limits');
      setLimits(limitsRes.data.data);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create comparison');
    }
  };

  // View a comparison from history
  const handleViewComparison = async (comparisonId: number) => {
    try {
      const response = await api.get(`/bill-comparison/comparisons/${comparisonId}`);
      setActiveComparison(response.data.data.comparison);
      setViewMode('result');
      setAnalysisError(null);
    } catch (error) {
      toast.error('Failed to load comparison');
    }
  };

  // Retry analysis
  const handleRetryAnalysis = async () => {
    if (!activeComparison) return;

    setAnalyzing(true);
    setAnalysisError(null);

    try {
      const analyzeResponse = await api.post(`/bill-comparison/comparisons/${activeComparison.id}/analyze`);
      const updatedComparison = {
        ...activeComparison,
        status: 'completed' as const,
        resultData: analyzeResponse.data.data.comparison.resultData,
        resultSummary: analyzeResponse.data.data.comparison.resultSummary,
      };
      setActiveComparison(updatedComparison);
      toast.success('AI analysis completed!');
    } catch (error: any) {
      setAnalysisError(error.response?.data?.error?.message || 'AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Delete a comparison
  const handleDeleteComparison = async (comparisonId: number) => {
    try {
      await api.delete(`/bill-comparison/comparisons/${comparisonId}`);
      setComparisons((prev) => prev.filter((c) => c.id !== comparisonId));
      toast.success('Comparison deleted');
    } catch (error) {
      toast.error('Failed to delete comparison');
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handle tab change
  const handleTabChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'history') {
      fetchComparisons();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Bill Comparison</h1>
      <p className="text-gray-600 mb-6">
        Upload two bills or receipts to compare prices using AI analysis.
      </p>

      {/* Tab Navigation */}
      {viewMode !== 'result' && (
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => handleTabChange('upload')}
            className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors ${
              viewMode === 'upload'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Upload className="w-4 h-4 inline-block mr-2" />
            Upload & Compare
          </button>
          <button
            onClick={() => handleTabChange('history')}
            className={`px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors ${
              viewMode === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4 inline-block mr-2" />
            History
          </button>
        </div>
      )}

      {/* Back button for result view */}
      {viewMode === 'result' && (
        <button
          onClick={() => setViewMode('upload')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Upload
        </button>
      )}

      {/* Usage Limits Banner - only show on upload tab */}
      {viewMode === 'upload' && limits && (
        <div className={`mb-6 p-4 rounded-lg ${
          limits.canCreate ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">
                Daily Comparisons: {limits.usedToday} / {limits.dailyLimit}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {limits.canCreate
                  ? `${limits.remaining} comparison${limits.remaining !== 1 ? 's' : ''} remaining today`
                  : 'Upgrade to Pro for unlimited comparisons'
                }
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              limits.tier === 'pro' ? 'bg-purple-100 text-purple-700' :
              limits.tier === 'basic' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {limits.tier.charAt(0).toUpperCase() + limits.tier.slice(1)} Plan
            </span>
          </div>
        </div>
      )}

      {/* Upload Tab Content */}
      {viewMode === 'upload' && (
        <>
          {/* Drag and Drop Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${uploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept="image/jpeg,image/png"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              disabled={uploading}
            />

            {uploading ? (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
                <p className="text-gray-600">Uploading...</p>
                <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drag and drop your bills here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-400">
                  Supported formats: JPG, PNG (max 5MB)
                </p>
              </>
            )}
          </div>

          {/* Selected Images for Comparison */}
          {selectedImages.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">
                    {selectedImages.length}/2 images selected for comparison
                  </span>
                </div>
                <button
                  onClick={handleCreateComparison}
                  disabled={selectedImages.length !== 2 || !limits?.canCreate}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedImages.length === 2 && limits?.canCreate
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Compare Bills
                </button>
              </div>
            </div>
          )}

          {/* Uploaded Images Grid */}
          {uploadedImages.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Uploaded Images ({uploadedImages.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((image) => (
                  <div
                    key={image.id}
                    className={`relative group rounded-lg border-2 overflow-hidden transition-all ${
                      selectedImages.includes(image.id)
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Image Preview */}
                    <div
                      className="aspect-square bg-gray-100 cursor-pointer"
                      onClick={() => toggleImageSelection(image.id)}
                    >
                      {image.previewUrl ? (
                        <img
                          src={image.previewUrl}
                          alt={image.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FileText className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {selectedImages.includes(image.id) && (
                      <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteImage(image.id);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* File info */}
                    <div className="p-2 bg-white">
                      <p className="text-xs text-gray-700 truncate" title={image.fileName}>
                        {image.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.fileSize)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {uploadedImages.length === 0 && !uploading && (
            <div className="mt-8 text-center py-12 bg-gray-50 rounded-lg">
              <ImageIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No images uploaded yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Upload two bills to start comparing prices
              </p>
            </div>
          )}
        </>
      )}

      {/* History Tab Content */}
      {viewMode === 'history' && (
        <div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : comparisons.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <History className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No comparison history yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your completed comparisons will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comparisons.map((comparison) => (
                <div
                  key={comparison.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-gray-900">
                          {comparison.title || `Comparison #${comparison.id}`}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          comparison.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : comparison.status === 'processing'
                            ? 'bg-blue-100 text-blue-700'
                            : comparison.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {comparison.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(comparison.createdAt)}
                        </span>
                        {comparison.resultSummary && (
                          <span className="truncate max-w-md">{comparison.resultSummary}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {comparison.status === 'completed' && (
                        <button
                          onClick={() => handleViewComparison(comparison.id)}
                          className="flex items-center gap-1 px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteComparison(comparison.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Result View */}
      {viewMode === 'result' && (
        <ComparisonResults
          result={activeComparison?.resultData || null}
          loading={analyzing}
          error={analysisError}
          onRetry={handleRetryAnalysis}
          onUploadNew={() => setViewMode('upload')}
        />
      )}
    </div>
  );
};

export default BillComparison;
