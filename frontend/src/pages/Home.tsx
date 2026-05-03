import { Phone, Check, ArrowRight, Play, MapPin, Mail, Globe, Menu, X, ArrowUpRight, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getAnnouncementsAPI, type Announcement } from '../api/announcement';

export default function Home({
   onGoLogin,
   onGoRegister,
   onGoCatalog,
}: {
   onGoLogin: () => void;
   onGoRegister: () => void;
   onGoCatalog: () => void;
}) {
   const logoUrl = new URL('../assets/logo.png', import.meta.url).toString();
   const imgBeBon = new URL('../assets/be-bon.jpg', import.meta.url).toString();
   const imgQuatHut = new URL('../assets/quat-hut.jpg', import.meta.url).toString();
   const imgVatTu = new URL('../assets/vat-tu.jpg', import.meta.url).toString();
   const imgTuHut = new URL('../assets/tu-hut.jpg', import.meta.url).toString();
   const imgAbout = new URL('../assets/about-us.jpg', import.meta.url).toString();
   const imgMyHero = new URL('../assets/my-hero.jpg', import.meta.url).toString();

   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [announcements, setAnnouncements] = useState<Announcement[]>([]);

   useEffect(() => {
      getAnnouncementsAPI().then(setAnnouncements).catch(() => { });
   }, []);

   const scrollTo = (id: string) => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setIsMenuOpen(false);
   };

   const productCategories = [
      { title: 'Bể và bồn chứa hóa chất', items: ['Bể mạ', 'Bồn PP/PVC', 'Bồn Composite', 'Bồn kết hợp'], image: imgBeBon },
      { title: 'Quạt hút ly tâm', items: ['Quạt ly tâm PP', 'Quạt trung áp', 'Quạt cao áp', 'Quạt hút khí độc'], image: imgQuatHut },
      { title: 'Vật tư nhựa PP, PVC', items: ['Tấm nhựa PP/PE', 'Ống nhựa PVC', 'Phụ kiện hàn nhựa', 'Van nhựa'], image: imgVatTu },
      { title: 'Hệ thống xử lý khí', items: ['Tủ hút hóa chất', 'Tháp hấp thụ', 'Hệ thống Scrubber', 'Ống dẫn và phụ kiện'], image: imgTuHut },
   ];

   return (
      <div className="min-h-screen bg-white text-black font-sans selection:bg-blue-600 selection:text-white">
         {/* Top Bar */}
         <div className="bg-black text-white py-3 px-6 hidden sm:block">
            <div className="max-w-7xl mx-auto flex justify-between items-center text-xs font-bold uppercase tracking-widest text-neutral-400">
               <div className="flex gap-8">
                  <span className="flex items-center gap-2"><MapPin size={14} className="text-blue-500" /> KCN Quang Minh, Mê Linh, Hà Nội</span>
                  <span className="flex items-center gap-2"><Mail size={14} className="text-blue-500" /> sales@opep.vn</span>
               </div>
               <div>Industrial Plastics & Environmental Technology</div>
            </div>
         </div>

         {/* Header */}
         <header className="border-b border-neutral-200 px-6 py-6 bg-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
               <div className="flex items-center gap-6">
                  <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain" />
                  <div className="hidden sm:block">
                     <h1 className="text-2xl font-bold tracking-tighter leading-none m-0">OPEP</h1>
                     <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Việt Nam</p>
                  </div>
               </div>

               <nav className="hidden lg:flex items-center gap-12">
                  {['home', 'catalog', 'about', 'products', 'contact'].map(item => (
                     <button 
                        key={item} 
                        onClick={() => item === 'catalog' ? onGoCatalog() : scrollTo(item === 'home' ? 'hero' : item)} 
                        className="text-sm font-bold uppercase tracking-wider hover:text-blue-600 transition-colors"
                     >
                        {item === 'home' ? 'Trang chủ' : item === 'catalog' ? 'Danh mục' : item === 'about' ? 'Giới thiệu' : item === 'products' ? 'Sản phẩm' : 'Liên hệ'}
                     </button>
                  ))}
               </nav>

               <div className="flex items-center gap-6">
                  <button onClick={onGoLogin} className="hidden md:block text-sm font-bold uppercase tracking-wider hover:text-blue-600 transition-colors">
                     Đăng nhập
                  </button>
                  <button onClick={onGoRegister} className="px-8 py-4 bg-blue-600 text-white text-sm font-bold uppercase tracking-widest hover:bg-black transition-colors focus:outline-none">
                     Báo giá ngay
                  </button>
                  <button className="lg:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                     {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
                  </button>
               </div>
            </div>
         </header>

         {/* Hero */}
         <section id="hero" className="border-b border-neutral-200">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[75vh]">
               {/* Left Content */}
               <div className="px-6 py-20 lg:py-32 lg:px-20 flex flex-col justify-center">
                  <div className="max-w-xl">
                     <div className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-8 flex items-center gap-4">
                        <span className="w-8 h-0.5 bg-blue-600"></span>
                        Chất lượng hàng đầu
                     </div>
                     <h2 className="text-6xl md:text-7xl lg:text-[5.5rem] font-bold tracking-tighter leading-[0.9] mb-8 break-words text-black">
                        GIẢI PHÁP <br/> NHỰA <br/> KỸ THUẬT.
                     </h2>
                     <p className="text-lg md:text-xl text-neutral-600 leading-relaxed mb-16 max-w-md font-normal">
                        Tiên phong cung cấp thiết bị nhựa đặc chủng chống ăn mòn và hệ thống xử lý khí thải công nghiệp hiệu suất cao tại Việt Nam.
                     </p>
                     
                     <div className="flex flex-col sm:flex-row gap-8 mb-16 items-start sm:items-center">
                        <button onClick={onGoRegister} className="flex items-center justify-center gap-4 px-10 py-5 bg-black text-white font-bold uppercase tracking-wider hover:bg-blue-600 transition-colors focus:outline-none">
                           Hợp tác ngay <ArrowRight size={20} />
                        </button>
                        <div className="flex flex-col justify-center">
                           <span className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1.5 font-bold">Hotline Hỗ Trợ 24/7</span>
                           <span className="text-3xl font-bold tracking-tight text-black">0913 213 091</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-y-5 border-l-2 border-neutral-200 pl-6 mt-8">
                        {[
                           'Sản xuất Bồn chứa PP, PE, PVC, FRP',
                           'Hệ thống Thiết bị xử lý khí & nước thải',
                           'Quạt ly tâm chống ăn mòn hóa chất',
                        ].map((t, idx) => (
                           <div key={idx} className="flex gap-4 items-start">
                              <Check size={20} strokeWidth={3} className="text-blue-600 shrink-0 mt-0.5" />
                              <span className="text-sm font-bold tracking-wide uppercase text-neutral-800">{t}</span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Right Image */}
               <div className="h-[60vh] lg:h-auto border-t lg:border-t-0 lg:border-l border-neutral-200 relative bg-neutral-100">
                  <img src={imgMyHero} className="w-full h-full object-cover transition-all duration-1000" alt="Industrial construction" />
               </div>
            </div>
         </section>

         {/* Stats */}
         <div className="bg-neutral-50 border-b border-neutral-200">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-neutral-200 border-x border-neutral-200 max-w-7xl mx-auto">
               {[
                  { label: 'Năm kinh nghiệm', val: '10+' },
                  { label: 'Tỉ lệ hài lòng', val: '99%' },
                  { label: 'Dự án công nghiệp', val: '500+' },
                  { label: 'Khách hàng', val: '2000+' }
               ].map((s, i) => (
                  <div key={s.label} className={`p-10 lg:p-16 text-center lg:text-left ${i < 2 ? 'border-b lg:border-b-0 border-neutral-200' : ''}`}>
                     <p className="text-5xl lg:text-6xl font-bold tracking-tighter mb-4 text-black">{s.val}</p>
                     <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">{s.label}</p>
                  </div>
               ))}
            </div>
         </div>

         {/* About */}
         <section id="about" className="py-24 lg:py-40 px-6 border-b border-neutral-200 bg-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24 items-center">
               <div className="lg:col-span-6 relative w-full aspect-[4/5] bg-neutral-100 border border-neutral-200 order-2 lg:order-1">
                  <img src={imgAbout} alt="About OPEP" className="w-full h-full object-cover absolute inset-0 grayscale hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute top-0 left-0 w-32 h-32 md:w-48 md:h-48 bg-blue-600 flex flex-col justify-center items-center text-white p-6 outline outline-1 outline-blue-600 outline-offset-4 m-4">
                     <span className="text-5xl md:text-6xl font-bold tracking-tighter">10+</span>
                     <span className="text-xs font-bold uppercase tracking-widest mt-2 md:mt-4 text-center leading-tight">Năm <br/> kinh nghiệm</span>
                  </div>
               </div>
               <div className="lg:col-span-6 space-y-12 order-1 lg:order-2">
                  <div>
                     <h3 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-4">
                        <span className="w-12 h-0.5 bg-blue-600"></span> Về chúng tôi
                     </h3>
                     <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none text-black">
                        CÔNG NGHỆ BỀN VỮNG.
                     </h2>
                  </div>
                  <p className="text-xl text-neutral-600 leading-relaxed font-normal max-w-lg">
                     OPEP Việt Nam vinh dự là nhà sản xuất thiết bị nhựa kỹ thuật uy tín phục vụ môi trường hóa chất ăn mòn cao. Thay vì chỉ cung cấp sản phẩm máy móc rập khuôn, chúng tôi cung cấp <strong>giải pháp kỹ thuật toàn diện</strong>, đặt sự bền vững của doanh nghiệp bạn lên hàng đầu.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-6 border-t border-neutral-200 pt-12">
                     {['Tư vấn kĩ thuật 24/7', 'Thi công lắp đặt trọn gói', 'Bảo hành lên tới 24 tháng', 'Vật liệu đạt chuẩn quốc tế'].map(t => (
                        <div key={t} className="flex items-start gap-4">
                           <Check size={24} strokeWidth={2.5} className="text-blue-600 shrink-0" />
                           <span className="font-bold tracking-tight text-lg">{t}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         </section>

         {/* Products */}
         <section id="products" className="py-24 lg:py-40 px-6 bg-neutral-50 border-b border-neutral-200">
            <div className="max-w-7xl mx-auto">
               <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-24 gap-8">
                  <div className="max-w-3xl">
                     <h3 className="text-blue-600 font-bold uppercase tracking-widest text-sm mb-6 flex items-center gap-4">
                        <span className="w-12 h-0.5 bg-blue-600"></span> Sản phẩm
                     </h3>
                     <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none text-black">
                        HỆ SINH THÁI THIẾT BỊ
                     </h2>
                  </div>
                  <button onClick={onGoCatalog} className="flex items-center gap-4 pb-2 border-b-2 border-black font-bold uppercase tracking-widest hover:text-blue-600 hover:border-blue-600 transition-colors text-sm">
                     Tất cả sản phẩm <ArrowRight size={20} />
                  </button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200 border border-neutral-200">
                  {productCategories.map((cat, idx) => (
                     <div key={cat.title} className="group cursor-pointer bg-white flex flex-col h-full hover:bg-neutral-50 transition-colors relative">
                        <div className="aspect-square bg-neutral-100 overflow-hidden relative border-b border-neutral-200">
                           <img src={cat.image} alt={cat.title} className="w-full h-full object-cover grayscale mix-blend-multiply group-hover:grayscale-0 group-hover:mix-blend-normal group-hover:scale-105 transition-all duration-700" />
                           <div className="absolute top-0 left-0 bg-black text-white text-sm font-bold px-4 py-2 uppercase tracking-widest m-6">
                              0{idx + 1}
                           </div>
                        </div>
                        <div className="p-10 flex-1 flex flex-col">
                           <h4 className="text-2xl font-bold tracking-tight mb-8 group-hover:text-blue-600 transition-colors">{cat.title}</h4>
                           <ul className="space-y-5 mt-auto">
                              {cat.items.map(item => (
                                 <li key={item} className="text-sm font-medium text-neutral-600 flex items-center gap-4">
                                    <span className="w-6 h-px bg-black"></span> {item}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </section>

         {/* Why Choose Us */}
         <section className="py-24 lg:py-40 px-6 bg-black text-white border-b border-neutral-800">
            <div className="max-w-7xl mx-auto">
               <div className="mb-24">
                  <h2 className="text-5xl md:text-7xl font-bold tracking-tighter max-w-4xl leading-[1.1] text-white">
                     YẾU TỐ CỐT LÕI TẠO NÊN SỰ KHÁC BIỆT CỦA OPEP.
                  </h2>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-neutral-800 border-t border-neutral-800">
                  {[
                     { icon: <Check size={48} strokeWidth={1.5} />, title: 'Kỹ thuật tay nghề cao', desc: 'Đội ngũ kĩ sư và thợ hàn nhựa giàu kinh nghiệm trong lĩnh vực xử lý hóa chất công nghiệp.' },
                     { icon: <Phone size={48} strokeWidth={1.5} />, title: 'Hỗ trợ dự án chu đáo', desc: 'Tư vấn giải pháp miễn phí và khảo sát thực tế tại mọi công trình của khách hàng.' },
                     { icon: <Globe size={48} strokeWidth={1.5} />, title: 'Mạng lưới cung ứng rộng', desc: 'Phân phối vật tư và thiết bị trên khắp cả nước với tiến độ sản xuất nhanh nhất.' }
                  ].map((benefit, i) => (
                     <div key={i} className={`py-12 md:py-16 ${i === 0 ? 'md:pr-12' : i === 1 ? 'md:px-12' : 'md:pl-12'} flex flex-col h-full`}>
                        <div className="text-blue-500 mb-10">
                           {benefit.icon}
                        </div>
                        <h4 className="text-3xl font-bold tracking-tight mb-6">{benefit.title}</h4>
                        <p className="text-neutral-400 font-normal leading-relaxed text-lg max-w-sm">{benefit.desc}</p>
                     </div>
                  ))}
               </div>
            </div>
         </section>


         {/* Footer */}
         <footer id="contact" className="bg-black text-white pt-32 pb-12 px-6">
            <div className="max-w-7xl mx-auto">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-12 mb-32">
                  {/* Brand */}
                  <div className="lg:col-span-4 flex flex-col justify-between">
                     <div>
                        <div className="flex items-center gap-6 mb-10">
                           <img src={logoUrl} alt="Logo" className="h-12 w-auto bg-white p-2" />
                           <div>
                              <h1 className="text-3xl font-bold tracking-tighter leading-none m-0">OPEP</h1>
                              <p className="text-[10px] text-neutral-400 uppercase tracking-widest mt-1">Việt Nam</p>
                           </div>
                        </div>
                        <p className="text-neutral-400 font-normal leading-relaxed mb-8 max-w-sm">
                           Nhà cung cấp số 1 về nhựa kỹ thuật đặc chủng và xử lý khí phòng Lab tại Việt Nam.
                        </p>
                     </div>
                     <p className="text-sm text-neutral-500 uppercase tracking-widest font-bold">EST. 2012</p>
                  </div>

                  {/* Links */}
                  <div className="lg:col-span-2">
                     <h4 className="font-bold uppercase tracking-widest text-xs mb-10 text-neutral-500">Sản phẩm</h4>
                     <ul className="space-y-6">
                        {['Bể chứa hóa chất', 'Quạt hút ly tâm', 'Xử lý khí thải', 'Vật tư nhựa PP/PVC'].map((item, idx) => (
                           <li key={idx}>
                              <a href="#" className="flex items-center gap-3 text-neutral-300 hover:text-white font-medium hover:pl-2 transition-all">
                                 <ArrowRight size={14} className="text-blue-500" /> {item}
                              </a>
                           </li>
                        ))}
                     </ul>
                  </div>

                  {/* Contact info */}
                  <div className="lg:col-span-3">
                     <h4 className="font-bold uppercase tracking-widest text-xs mb-10 text-neutral-500">Liên hệ</h4>
                     <ul className="space-y-8">
                        <li className="flex items-start gap-4">
                           <MapPin size={24} className="text-neutral-600 shrink-0 mt-0.5" />
                           <span className="text-white font-bold leading-relaxed">KCN Quang Minh<br/>Mê Linh, Hà Nội, Việt Nam</span>
                        </li>
                        <li className="flex items-center gap-4">
                           <Phone size={24} className="text-neutral-600 shrink-0" />
                           <span className="text-white font-bold">0913 213 091</span>
                        </li>
                        <li className="flex items-center gap-4">
                           <Mail size={24} className="text-neutral-600 shrink-0" />
                           <span className="text-white font-bold">sales@opep.vn</span>
                        </li>
                     </ul>
                  </div>

                  {/* Map */}
                  <div className="lg:col-span-3 h-56 border border-neutral-800 bg-neutral-900 overflow-hidden relative">
                     <iframe
                        title="map"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3719.9827059733!2d105.794!3d21.189!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjHCsDExJzIwLjgiTiAxMDXCsDQ3JzM4LjQiRQ!5e0!3m2!1svi!2s!4v1650000000000!5m2!1svi!2s"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        className="grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-700 absolute inset-0"
                        loading="lazy"
                     ></iframe>
                  </div>
               </div>

               <div className="border-t border-neutral-800 pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                     © {new Date().getFullYear()} OPEP VIỆT NAM. ALL RIGHTS RESERVED.
                  </p>
                  <div className="flex gap-10">
                     <a href="#" className="text-neutral-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold">Điều khoản & Dịch vụ</a>
                     <a href="#" className="text-neutral-500 hover:text-white transition-colors text-[10px] uppercase tracking-widest font-bold">Chính sách bảo mật</a>
                  </div>
               </div>
            </div>
         </footer>

         {/* Mobile Sidebar */}
         {isMenuOpen && (
            <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col animate-in fade-in duration-300">
               <div className="p-6 flex justify-between items-center border-b border-neutral-800">
                  <div className="font-bold text-2xl tracking-tighter">OPEP.</div>
                  <button onClick={() => setIsMenuOpen(false)} className="text-neutral-400 hover:text-white transition-colors"><X size={36} /></button>
               </div>
               <nav className="flex-1 p-8 flex flex-col justify-center space-y-10">
                  {['home', 'catalog', 'about', 'products', 'contact'].map((item, idx) => (
                     <div key={'m' + item} className="flex flex-col relative group">
                        <span className="text-neutral-600 text-xs font-bold uppercase tracking-widest mb-1">0{idx + 1}</span>
                        <button 
                           onClick={() => item === 'catalog' ? onGoCatalog() : scrollTo(item === 'home' ? 'hero' : item)} 
                           className="text-4xl xs:text-5xl font-bold tracking-tighter uppercase text-left hover:text-blue-500 transition-colors leading-none"
                        >
                           {item === 'home' ? 'TRANG CHỦ' : item === 'catalog' ? 'DANH MỤC' : item === 'about' ? 'GIỚI THIỆU' : item === 'products' ? 'SẢN PHẨM' : 'LIÊN HỆ'}
                        </button>
                     </div>
                  ))}
               </nav>
               <div className="p-8 border-t border-neutral-800 bg-neutral-950 flex flex-col gap-4">
                  <button onClick={onGoRegister} className="w-full bg-white text-black py-6 font-bold tracking-tighter uppercase hover:bg-blue-600 hover:text-white transition-colors text-lg flex justify-center items-center gap-3">
                     Báo giá ngay <ArrowRight size={20}/>
                  </button>
                  <button onClick={onGoLogin} className="w-full bg-transparent border border-neutral-700 text-white py-6 font-bold tracking-tighter uppercase hover:bg-neutral-900 transition-colors text-lg">
                     Đăng nhập hệ thống
                  </button>
               </div>
            </div>
         )}
      </div>
   );
}
