// src/pages/Catalog.tsx
import { useState } from 'react';
import { Phone, Menu, X, ArrowRight, Search, Filter, Home as HomeIcon, MapPin, Mail, Trash2 } from 'lucide-react';

// Category Base Images
import imgPE from '../assets/catalog/pe-tank.png';
import imgHood from '../assets/catalog/fume-hood.png';
import imgLab from '../assets/catalog/lab-bench.png';
import imgAcrylic from '../assets/catalog/acrylic.png';
import imgChemTank from '../assets/catalog/chem-tank.png';
import imgScrubber from '../assets/catalog/scrubber.png';
import imgFan from '../assets/catalog/fan.png';
import imgSheet from '../assets/catalog/plastic-sheets.png';

// Specific Item Variations
import imgPETall from '../assets/catalog/pe-tank-1000l.png';
import imgPEHorizontal from '../assets/catalog/pe-tank-2000l.png';
import imgHood15 from '../assets/catalog/fume-hood-15m.png';
import imgChemCabinet from '../assets/catalog/chem-cabinet.png';
import imgLabShelf from '../assets/catalog/lab-shelf.png';
import imgGlassRack from '../assets/catalog/glass-rack.png';
import imgAcrylicCover from '../assets/catalog/acrylic-cover.png';
import imgMicaBox from '../assets/catalog/mica-box.png';

export default function Catalog({
   onGoLogin,
   onGoRegister,
   onBack
}: {
   onGoLogin: () => void;
   onGoRegister: () => void;
   onBack: () => void;
}) {
   const logoUrl = new URL('../assets/logo.png', import.meta.url).toString();
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

   // Structured Data with Variations
   const allProducts = [
      // Bồn Bể Nhựa PE
      { id: 'SP-01', name: 'Bồn nhựa PE 500L', category: 'Bồn Bể Nhựa PE', image: imgPE },
      { id: 'SP-02', name: 'Bồn nhựa PE 1000L đứng', category: 'Bồn Bể Nhựa PE', image: imgPETall },
      { id: 'SP-03', name: 'Bồn nhựa PE 2000L ngang', category: 'Bồn Bể Nhựa PE', image: imgPEHorizontal },
      
      // Tủ Hút Khí Độc
      { id: 'SP-04', name: 'Tủ hút khí độc 1.2m', category: 'Tủ Hút Khí Độc', image: imgHood },
      { id: 'SP-05', name: 'Tủ hút khí độc 1.5m chịu acid', category: 'Tủ Hút Khí Độc', image: imgHood15 },
      { id: 'SP-06', name: 'Tủ đựng hóa chất có lọc', category: 'Tủ Hút Khí Độc', image: imgChemCabinet },
      
      // Trang Thiết Bị Phòng Thí Nghiệm
      { id: 'SP-07', name: 'Bàn thí nghiệm trung tâm', category: 'Trang Thiết Bị Phòng Thí Nghiệm', image: imgLab },
      { id: 'SP-08', name: 'Kệ mẫu phòng Lab', category: 'Trang Thiết Bị Phòng Thí Nghiệm', image: imgLabShelf },
      { id: 'SP-09', name: 'Giá treo dụng cụ thủy tinh', category: 'Trang Thiết Bị Phòng Thí Nghiệm', image: imgGlassRack },
      
      // Sản Phẩm Bằng Acrylic
      { id: 'SP-10', name: 'Bể cá Acrylic trang trí', category: 'Sản Phẩm Bằng Acrylic', image: imgAcrylic },
      { id: 'SP-11', name: 'Nắp máy Acrylic bảo vệ', category: 'Sản Phẩm Bằng Acrylic', image: imgAcrylicCover },
      { id: 'SP-12', name: 'Hộp mica trưng bày', category: 'Sản Phẩm Bằng Acrylic', image: imgMicaBox },
      
      // Bồn Bể Nhựa PP, PVC, FRP (Using base img for variations due to quota limit)
      { id: 'SP-13', name: 'Bồn mạ kẽm nhựa PP', category: 'Bồn Bể Nhựa PP, PVC, FRP', image: imgChemTank },
      { id: 'SP-14', name: 'Bồn chứa hóa chất PVC', category: 'Bồn Bể Nhựa PP, PVC, FRP', image: imgChemTank },
      { id: 'SP-15', name: 'Bồn Composite FRP 5m3', category: 'Bồn Bể Nhựa PP, PVC, FRP', image: imgChemTank },
      
      // Thiết Bị Xử Lý Khí Thải
      { id: 'SP-16', name: 'Tháp hấp thụ Scrubber PP', category: 'Thiết Bị Xử Lý Khí Thải', image: imgScrubber },
      { id: 'SP-17', name: 'Hệ thống khử mùi than hoạt tính', category: 'Thiết Bị Xử Lý Khí Thải', image: imgScrubber },
      { id: 'SP-18', name: 'Ống dẫn khí thải nhựa PP', category: 'Thiết Bị Xử Lý Khí Thải', image: imgScrubber },
      
      // Quạt Hút Ly Tâm
      { id: 'SP-19', name: 'Quạt hút ly tâm PP 1.1kW', category: 'Quạt Hút Ly Tâm', image: imgFan },
      { id: 'SP-20', name: 'Quạt ly tâm cao áp chịu acid', category: 'Quạt Hút Ly Tâm', image: imgFan },
      { id: 'SP-21', name: 'Phụ kiện quạt hút nhựa', category: 'Quạt Hút Ly Tâm', image: imgFan },
      
      // Nhựa Kỹ Thuật
      { id: 'SP-22', name: 'Tấm nhựa PP ghi xám 10mm', category: 'Nhựa Kỹ Thuật', image: imgSheet },
      { id: 'SP-23', name: 'Cây nhựa chịu hóa chất', category: 'Nhựa Kỹ Thuật', image: imgSheet },
      { id: 'SP-24', name: 'Màng nhựa PVC mềm', category: 'Nhựa Kỹ Thuật', image: imgSheet },
   ];

   const categories = [
      'Bồn Bể Nhựa PE',
      'Tủ Hút Khí Độc',
      'Trang Thiết Bị Phòng Thí Nghiệm',
      'Sản Phẩm Bằng Acrylic',
      'Bồn Bể Nhựa PP, PVC, FRP',
      'Thiết Bị Xử Lý Khí Thải',
      'Quạt Hút Ly Tâm',
      'Nhựa Kỹ Thuật'
   ];

   // Filtering Logic
   const filteredProducts = allProducts.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
   });

   const getCategoryCount = (cat: string) => allProducts.filter(p => p.category === cat).length;

   return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-blue-600 selection:text-white">
         
         {/* Top Bar */}
         <div className="bg-black text-white py-3 px-6 hidden sm:block">
            <div className="max-w-7xl mx-auto flex justify-between items-center text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400">
               <div className="flex gap-8">
                  <span className="flex items-center gap-2"><MapPin size={12} className="text-blue-500" /> KCN Quang Minh, Mê Linh, Hà Nội</span>
                  <span className="flex items-center gap-2"><Mail size={12} className="text-blue-500" /> sales@opep.vn</span>
               </div>
               <div>Industrial Plastics & Environmental Technology</div>
            </div>
         </div>

         {/* Header */}
         <header className="border-b border-neutral-200 px-6 py-6 bg-white/90 backdrop-blur-md sticky top-0 z-[100]">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
               <div className="flex items-center gap-6 cursor-pointer" onClick={onBack}>
                  <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                  <div className="hidden sm:block">
                     <h1 className="text-2xl font-bold tracking-tighter leading-none m-0">OPEP</h1>
                     <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Việt Nam</p>
                  </div>
               </div>

               <nav className="hidden lg:flex items-center gap-10">
                  <button onClick={onBack} className="text-xs font-bold uppercase tracking-widest hover:text-blue-600 transition-colors flex items-center gap-2">
                     <HomeIcon size={14} /> Trang chủ
                  </button>
                  <button 
                     onClick={() => {setSelectedCategory(null); setSearchQuery('');}}
                     className={`text-xs font-bold uppercase tracking-widest transition-colors ${!selectedCategory ? 'text-blue-600 border-b-2 border-blue-600 pb-1' : 'hover:text-blue-600'}`}
                  >
                     Danh mục
                  </button>
               </nav>

               <div className="flex items-center gap-6">
                  <button onClick={onGoLogin} className="hidden md:block text-xs font-bold uppercase tracking-widest hover:text-blue-600 transition-colors">
                     Đăng nhập
                  </button>
                  <button onClick={onGoRegister} className="px-8 py-4 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-black transition-all focus:outline-none shadow-xl shadow-blue-500/20">
                     Báo giá ngay
                  </button>
                  <button className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                     {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                  </button>
               </div>
            </div>
         </header>

         {/* Banner */}
         <div className="bg-neutral-50 border-b border-neutral-200 py-12 px-6">
            <div className="max-w-7xl mx-auto">
               <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none text-black mb-4 uppercase">
                  {selectedCategory || 'Tất cả sản phẩm'}
               </h2>
               <div className="flex items-center gap-4 text-blue-600 font-bold uppercase tracking-widest text-xs">
                  <span className="w-12 h-0.5 bg-blue-600"></span> 
                  Khám phá giải pháp nhựa kỹ thuật đặc chủng
               </div>
            </div>
         </div>

         {/* Main Content */}
         <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
               
               {/* Sidebar */}
               <div className="lg:col-span-3">
                  <div className="sticky top-32 space-y-12">
                     <div>
                        <div className="flex justify-between items-center mb-8">
                           <h3 className="text-xs font-bold text-black uppercase tracking-[0.2em] flex items-center gap-3">
                              <Filter size={14} /> Bộ lọc danh mục
                           </h3>
                           {(selectedCategory || searchQuery) && (
                              <button onClick={() => {setSelectedCategory(null); setSearchQuery('');}} className="text-[10px] text-blue-600 font-bold uppercase hover:underline">Xóa lọc</button>
                           )}
                        </div>
                        <ul className="space-y-0 text-sm border-t border-neutral-100">
                           {categories.map((cat, idx) => (
                              <li key={idx} className="group border-b border-neutral-100">
                                 <button 
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`w-full flex items-center justify-between py-4 group-hover:pl-2 transition-all duration-300 font-medium uppercase tracking-tight text-[13px] ${selectedCategory === cat ? 'text-blue-600 pl-2' : 'text-slate-600 group-hover:text-blue-600'}`}
                                 >
                                    {cat}
                                    <span className={`text-[10px] px-2 py-1 rounded transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                                       {getCategoryCount(cat)}
                                    </span>
                                 </button>
                              </li>
                           ))}
                        </ul>
                     </div>
                  </div>
               </div>

               {/* Grid Content */}
               <div className="lg:col-span-9">
                  <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm">
                     <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                           type="text" 
                           placeholder="Tìm sản phẩm..." 
                           className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-100 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:bg-white transition-all uppercase font-medium tracking-tight"
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                        />
                     </div>
                     <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-full md:w-auto">
                        <span>Hiển thị {filteredProducts.length} kết quả</span>
                        <div className="hidden md:block">
                           <select className="border border-neutral-100 rounded-xl px-4 py-3 bg-neutral-50 text-black outline-none hover:border-blue-300 transition-colors min-w-[150px] text-xs font-bold uppercase tracking-widest cursor-pointer">
                              <option>Mới nhất</option>
                              <option>Tên A-Z</option>
                           </select>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 min-h-[400px]">
                     {filteredProducts.length > 0 ? (
                        filteredProducts.map((p, idx) => (
                           <div key={p.id} className="group cursor-pointer animate-in fade-in zoom-in duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
                              <div className="aspect-square bg-slate-100 mb-6 overflow-hidden relative border border-slate-200 rounded-3xl shadow-sm group-hover:shadow-xl group-hover:shadow-blue-500/10 transition-all duration-500">
                                 <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000 ease-out" />
                                 <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 bg-gradient-to-t from-black/80 to-transparent">
                                    <button onClick={onGoRegister} className="w-full py-3 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all rounded-xl flex items-center justify-center gap-2">
                                       Yêu cầu báo giá <ArrowRight size={12} />
                                    </button>
                                 </div>
                                 <div className="absolute top-4 left-4">
                                    <span className="px-3 py-1 bg-white/95 backdrop-blur-md shadow-sm text-[9px] font-extrabold tracking-widest text-blue-600 uppercase rounded-full border border-blue-100">
                                       {p.id}
                                    </span>
                                 </div>
                              </div>
                              <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <span className="w-4 h-0.5 bg-blue-600"></span> {p.category}
                              </h4>
                              <h3 className="text-lg font-bold tracking-tight text-black group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                                 {p.name}
                              </h3>
                           </div>
                        ))
                     ) : (
                        <div className="col-span-full py-24 text-center border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50">
                           <div className="inline-flex items-center justify-center w-20 h-20 bg-white shadow-sm border border-neutral-100 rounded-full mb-6">
                              <Search size={32} className="text-slate-300" />
                           </div>
                           <h3 className="text-xl font-bold text-black mb-2 uppercase tracking-tighter">Không tìm thấy sản phẩm</h3>
                           <p className="text-slate-500 text-sm">Vui lòng thử từ khóa khác hoặc xóa bộ lọc.</p>
                           <button onClick={() => {setSelectedCategory(null); setSearchQuery('');}} className="mt-8 px-10 py-4 bg-black text-white font-bold uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all rounded-xl shadow-lg">Xem tất cả sản phẩm</button>
                        </div>
                     )}
                  </div>
               </div>
            </div>
         </div>

         {/* Footer */}
         <footer className="bg-neutral-900 text-neutral-400 py-12 px-6 border-t border-neutral-800 mt-20">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
               <div className="flex items-center gap-4">
                  <div className="h-8 w-8 bg-white/10 rounded flex items-center justify-center p-1 uppercase font-black text-[8px] text-white tracking-tighter">OPEP</div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">© 2024 OPEP Việt Nam. All rights reserved.</span>
               </div>
               <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest">
                  <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
                  <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
               </div>
            </div>
         </footer>
      </div>
   );
}
