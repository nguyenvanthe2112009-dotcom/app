import React, { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Image as ImageIcon, Download, Youtube, Wand2, RefreshCw, LayoutTemplate, X, Plus, Key, ExternalLink, LogOut } from 'lucide-react';
import { generateThumbnail } from './services/geminiService.js';
import Button from './components/Button.js';
import { TextInput, TextArea, SelectInput } from './components/Input.js';
import { ThumbnailState } from './types.js';

const PRESET_STYLES = [
  { value: "Professional, High Quality, Viral YouTube Thumbnail Style, Eye-catching composition", label: "Tự động (Auto)" },
  { value: "3D Cartoon, Pixar style, High detail, Vibrant colors", label: "Hoạt hình 3D (Pixar/Disney)" },
  { value: "Hyper-realistic, 4K, Professional photography, Dramatic lighting", label: "Ảnh thật (Realistic)" },
  { value: "Cyberpunk, Neon lights, Futuristic, Tech-focused", label: "Công nghệ / Cyberpunk" },
  { value: "Minimalist, Clean lines, Flat design, Soft pastel colors", label: "Tối giản (Minimalist)" },
  { value: "Comic book style, Bold outlines, Pop art, Action lines", label: "Truyện tranh (Comic)" },
  { value: "Horror, Dark atmosphere, Mysterious, High contrast shadow", label: "Kinh dị / Bí ẩn" },
  { value: "custom", label: "Tùy chọn khác..." }
];

const ASPECT_RATIOS = [
  { value: "16:9", label: "YouTube (16:9)", icon: "▭" },
  { value: "9:16", label: "Shorts (9:16)", icon: "▯" }
];

const App = () => {
  // --- API Key Management State ---
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySet, setIsKeySet] = useState<boolean>(false);
  const [keyInput, setKeyInput] = useState<string>('');

  // --- App Logic State ---
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  
  const [state, setState] = useState<ThumbnailState>({
    isLoading: false,
    generatedImage: null,
    error: null,
  });

  const [inputs, setInputs] = useState({
    title: "",
    description: "",
    selectedStyle: PRESET_STYLES[0].value,
    customStyle: "",
    aspectRatio: "16:9"
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for API Key in localStorage on initial load
  useEffect(() => {
    const storedKey = localStorage.getItem('geminiApiKey');
    if (storedKey) {
      setApiKey(storedKey);
      setIsKeySet(true);
    }
  }, []);

  const handleSetKey = () => {
    const trimmedKey = keyInput.trim();
    if (trimmedKey) {
      setApiKey(trimmedKey);
      localStorage.setItem('geminiApiKey', trimmedKey);
      setIsKeySet(true);
    }
  };

  const handleClearKey = () => {
    setApiKey('');
    setKeyInput('');
    localStorage.removeItem('geminiApiKey');
    setIsKeySet(false);
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (files.length >= 2) return; // Prevent more than 2 files

      const selectedFile = e.target.files[0];
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles(prev => [...prev, selectedFile]);
        setFilePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(selectedFile);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, i) => i !== indexToRemove));
    setFilePreviews(prev => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setState(prev => ({ ...prev, error: "API Key không được tìm thấy. Vui lòng đặt lại key." }));
      setIsKeySet(false);
      return;
    }
    if (!inputs.description) {
      setState(prev => ({ ...prev, error: "Vui lòng nhập ý tưởng thumbnail." }));
      return;
    }

    setState({ isLoading: true, generatedImage: null, error: null });
    const finalStyle = inputs.selectedStyle === 'custom' ? inputs.customStyle : inputs.selectedStyle;

    try {
      const resultImage = await generateThumbnail(
        apiKey,
        files,
        inputs.title,
        inputs.description,
        finalStyle || "Professional YouTube Thumbnail",
        inputs.aspectRatio
      );
      setState({ isLoading: false, generatedImage: resultImage, error: null });
    } catch (err: any) {
      if (err.message.includes('API Key không hợp lệ')) {
        handleClearKey();
      }
      setState({ 
        isLoading: false, 
        generatedImage: null, 
        error: err.message || "Tạo ảnh thất bại. Vui lòng thử lại." 
      });
    }
  };

  const handleDownload = () => {
    if (state.generatedImage) {
      const link = document.createElement('a');
      link.href = state.generatedImage;
      link.download = `thumbgen-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const setExampleData = () => {
    setInputs({
      ...inputs,
      title: "7 CÔNG CỤ AI",
      description: "Hướng dẫn về 7 công cụ AI cần thiết làm YouTube Faceless. Nền tối giản màu xanh đen, blur tiền đô đằng sau.",
      selectedStyle: PRESET_STYLES[1].value
    });
  };

  // --- RENDER API KEY GATEKEEPER ---
  if (!isKeySet) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-md w-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative z-10 flex flex-col items-center text-center">
          
          <div className="mb-6 relative">
             <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 rounded-full"></div>
             <img 
              src="https://yt3.googleusercontent.com/Gug5UDLjPMRBto68HqZvJCSryebEkqiI2_9qV_8y16ZKIVLgxYBFx_PyUYZStcTzSc3v7TLq=s900-c-k-c0x00ffffff-no-rj"
              alt="Văn Thế Web Avatar"
              className="w-24 h-24 rounded-full border-4 border-zinc-800 shadow-xl relative z-10"
            />
          </div>

          <h1 className="text-2xl font-bold mb-2">Kết nối Gemini API Key</h1>
          <p className="text-zinc-400 mb-8">
            Vui lòng nhập API Key Gemini của bạn để sử dụng công cụ. Key của bạn sẽ được lưu an toàn trong trình duyệt này.
          </p>

          <div className="w-full mb-4">
            <TextInput 
              label="Gemini API Key"
              type="password"
              placeholder="Dán API Key của bạn vào đây"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetKey()}
            />
          </div>

          <Button onClick={handleSetKey} className="w-full mb-4 group h-12">
            <Key className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Lưu và Tiếp tục
          </Button>

          <a 
            href="https://ai.google.dev/gemini-api/docs/api-key" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 hover:text-yellow-500 flex items-center gap-1 transition-colors"
          >
            Cách lấy API Key <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN APP ---
  return (
    <div className="min-h-screen bg-black text-white selection:bg-yellow-500/30 font-sans flex flex-col">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-yellow-400 to-orange-600 p-2 rounded-lg shadow-lg shadow-orange-500/20">
              <Youtube className="w-6 h-6 text-black fill-current" />
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-2">
               <span className="text-lg md:text-xl font-bold tracking-tight text-white">
                Công cụ tạo Thumbnail YTB <span className="text-yellow-400">Văn Thế Web</span>
              </span>
              <span className="text-lg md:text-xl font-bold text-white tracking-tight">038.6019.486</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800/50 rounded-full border border-zinc-700/50 cursor-pointer hover:bg-zinc-800 transition-colors" onClick={handleClearKey} title="Change API Key">
              <LogOut className="w-3 h-3 text-zinc-400" />
              <span className="text-xs font-medium text-zinc-400">Đổi API Key</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 w-full flex-grow">
        <div className="flex justify-center mb-10">
          <div className="relative group">
            <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 rounded-full group-hover:opacity-30 transition-opacity duration-500"></div>
            <img 
              src="https://yt3.googleusercontent.com/Gug5UDLjPMRBto68HqZvJCSryebEkqiI2_9qV_8y16ZKIVLgxYBFx_PyUYZStcTzSc3v7TLq=s900-c-k-c0x00ffffff-no-rj"
              alt="Văn Thế Web Avatar"
              className="w-36 h-36 rounded-full border-4 border-white shadow-2xl relative z-10 object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                  Ảnh đầu vào (Tùy chọn)
                </h2>
                <span className="text-xs text-zinc-500 font-medium bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                  {files.length}/2 ảnh
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {filePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border border-zinc-700 bg-zinc-900">
                    <img src={preview} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white p-1.5 rounded-full backdrop-blur-sm transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold">
                      Ảnh {index + 1}
                    </div>
                  </div>
                ))}

                {files.length < 2 && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-zinc-700 hover:border-yellow-500/50 hover:bg-zinc-900/50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all gap-2 group"
                  >
                    <div className="bg-zinc-800 p-3 rounded-full group-hover:scale-110 transition-transform">
                       <Plus className="w-5 h-5 text-zinc-400" />
                    </div>
                    <span className="text-xs font-medium text-zinc-400 group-hover:text-yellow-500">Thêm ảnh</span>
                  </div>
                )}
              </div>

              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              
              <p className="text-xs text-zinc-500 italic">
                *Bạn có thể tải lên tối đa 2 ảnh để kết hợp (VD: 1 người + 1 nền, hoặc 2 nhân vật). Nếu không tải ảnh, AI sẽ tự vẽ.
              </p>
            </section>

            <section className="space-y-6">
               <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                  Chi tiết Thumbnail
                </h2>
                <button 
                  onClick={setExampleData}
                  className="text-xs text-yellow-500 hover:text-yellow-400 font-medium flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3" /> Thử mẫu
                </button>
              </div>

              <div className="space-y-4 p-5 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Khung hình</label>
                  <div className="grid grid-cols-2 gap-3">
                    {ASPECT_RATIOS.map((ratio) => (
                      <button
                        key={ratio.value}
                        onClick={() => setInputs({...inputs, aspectRatio: ratio.value})}
                        className={`
                          flex items-center justify-center gap-2 py-3 px-4 rounded-lg border font-medium transition-all
                          ${inputs.aspectRatio === ratio.value 
                            ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' 
                            : 'bg-zinc-900/50 border-zinc-700 text-zinc-400 hover:border-zinc-500'}
                        `}
                      >
                        <LayoutTemplate className={`w-4 h-4 ${ratio.value === '9:16' ? 'rotate-90' : ''}`} />
                        {ratio.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <TextInput 
                    label="Tiêu đề (Chữ trong ảnh - Tùy chọn)" 
                    placeholder="Để trống nếu không muốn chèn chữ"
                    value={inputs.title}
                    onChange={(e) => setInputs({...inputs, title: e.target.value})}
                  />
                  <p className="text-xs text-zinc-500 mt-1 italic">*Nếu nhập, AI sẽ cố gắng viết đúng chính tả tiếng Việt.</p>
                </div>
                
                <TextArea 
                  label="Nội dung / Ý tưởng (Bắt buộc)" 
                  placeholder="Mô tả nội dung video của bạn..."
                  value={inputs.description}
                  onChange={(e) => setInputs({...inputs, description: e.target.value})}
                />

                <SelectInput 
                  label="Phong cách (Style)"
                  options={PRESET_STYLES}
                  value={inputs.selectedStyle}
                  onChange={(e) => setInputs({...inputs, selectedStyle: e.target.value})}
                />

                {inputs.selectedStyle === 'custom' && (
                   <TextInput 
                    label="Nhập phong cách tùy chọn" 
                    placeholder="VD: Vintage, Retro 80s, Watercolor..."
                    value={inputs.customStyle}
                    onChange={(e) => setInputs({...inputs, customStyle: e.target.value})}
                    className="animate-in fade-in slide-in-from-top-2 duration-300"
                  />
                )}
              </div>
            </section>

            <div className="sticky bottom-6 z-10">
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent -top-10 -z-10 pointer-events-none" />
              {state.error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {state.error}
                </div>
              )}
              <Button 
                onClick={handleGenerate} 
                isLoading={state.isLoading}
                className="w-full text-lg h-14 shadow-yellow-500/10"
              >
                <Sparkles className="w-5 h-5" />
                {files.length > 0 ? "Tạo Thumbnail từ Ảnh" : "Tạo Thumbnail từ Ý Tưởng"}
              </Button>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col h-full min-h-[500px]">
            <div className={`
              flex-1 bg-zinc-900/20 border border-zinc-800 rounded-3xl overflow-hidden relative flex flex-col
              transition-all duration-500
              ${inputs.aspectRatio === '9:16' ? 'max-w-md mx-auto w-full' : 'w-full'}
            `}>
              
              <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start pointer-events-none">
                <div className="bg-black/50 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-sm font-medium text-white/80">
                  Xem trước kết quả
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-4 lg:p-10 relative">
                <div className="absolute inset-0 opacity-[0.03]" 
                  style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}>
                </div>

                {state.isLoading ? (
                  <div className="flex flex-col items-center justify-center text-center gap-4">
                    <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-yellow-500 font-medium text-lg">Đang sáng tạo...</div>
                    <p className="text-zinc-500 text-sm max-w-xs">AI đang vẽ thumbnail theo ý tưởng của bạn, vui lòng đợi trong giây lát.</p>
                  </div>
                ) : state.generatedImage ? (
                  <div className={`
                    relative group w-full shadow-2xl shadow-black/50 rounded-lg overflow-hidden ring-1 ring-white/10
                    ${inputs.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'}
                  `}>
                     <img 
                      src={state.generatedImage} 
                      alt="Generated Thumbnail" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                       <Button onClick={handleDownload} variant="primary" className="scale-110">
                        <Download className="w-5 h-5" /> Tải xuống HD
                       </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-600 space-y-6 max-w-md text-center">
                    <div className="w-32 h-32 rounded-full bg-zinc-800/50 flex items-center justify-center relative">
                      <div className="absolute inset-0 border-4 border-dashed border-zinc-700 rounded-full animate-[spin_10s_linear_infinite]" />
                      <ImageIcon className="w-12 h-12 opacity-50" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-300 mb-2">Sẵn sàng thiết kế</h3>
                      <p className="text-zinc-500">
                        Nhập ý tưởng và tải ảnh (nếu có) để tạo Thumbnail chuyên nghiệp ngay lập tức.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
             <div className="mt-6 flex flex-col md:flex-row gap-6 text-sm text-zinc-500 px-2">
              <div className="flex-1">
                <h4 className="text-zinc-400 font-bold mb-1">Mẹo nhỏ:</h4>
                <p>Nếu dùng 2 ảnh, hãy chọn 1 ảnh nhân vật nền trong và 1 ảnh bối cảnh để AI ghép đẹp nhất.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-zinc-600 border-t border-zinc-800 mt-10">
        <div className="space-y-1">
          <p>
            Công cụ được phát triển bởi{' '}
            <a href="https://vantheweb.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-yellow-500 hover:underline">
              Văn Thế Web
            </a>{' '}
            sử dụng Gemini AI.
          </p>
          <p>
            Xem mã nguồn trên{' '}
            <a href="https://github.com/vantheweb/ytb-thumbnail-generator" target="_blank" rel="noopener noreferrer" className="font-semibold text-yellow-500 hover:underline">
              GitHub
            </a>.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
