import { Box, Calendar, DollarSign, Image as ImageIcon, Star, Wine, X, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../../services/api';
import { Toast } from '../ui/Toast';
// ✅ A correção está aqui: usamos 'import type' para o ToastType
import type { ToastType } from '../ui/Toast';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  data: any;
  setData: (data: any) => void;
}

export function ProductModal({ isOpen, onClose, onSubmit, data, setData }: ProductModalProps) {
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  if (!isOpen && !toast) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const rawToken = localStorage.getItem('@TavernaReserva:token');
    const token = rawToken ? rawToken.replace(/["']/g, '').trim() : null;

    try {
      const payload = {
        name: data.name,
        price: Number(data.price),
        category: data.category || 'Tinto',
        uva: data.uva || '',
        safra: data.safra || '',
        origem: data.origem || '',
        image_url: data.image_url || '',
        pontuacao: Number(data.pontuacao) || 0,
        stock: Number(data.stock) || 0,
        active: true,
        emOferta: Boolean(data.emOferta),
      };

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      if (data._id) {
        await api.put(`/products/${data._id}`, payload, config);
        setToast({ message: 'Rótulo atualizado com sucesso!', type: 'success' });
      } else {
        await api.post('/products', payload, config);
        setToast({ message: 'Novo vinho registrado na adega!', type: 'success' });
      }

      setTimeout(() => {
        onSubmit();
        onClose();
        setToast(null);
      }, 1500);
    } catch (err: any) {
      console.error('Erro ao salvar no banco:', err.response?.data);
      setToast({ message: 'Erro ao salvar. Verifique a conexão.', type: 'error' });
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={onClose} />

          <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-3xl rounded-[30px] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <header className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
              <div>
                <h2 className="text-2xl font-serif italic text-[#c2410c]">Curadoria de Rótulo</h2>
                <p className="text-[9px] font-cinzel text-zinc-500 uppercase tracking-[0.2em]">Registro de Acervo Reserva</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </header>

            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 space-y-4">
                  <label className="text-[10px] font-cinzel text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={12} className="text-[#c2410c]" /> Preview
                  </label>
                  <div className="aspect-[3/4] rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center overflow-hidden relative group">
                    {data.image_url ? (
                      <img
                        src={data.image_url}
                        alt="Preview"
                        className="w-full h-full object-contain p-4 drop-shadow-2xl"
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/400x600/000000/c2410c?text=Imagem+Inexistente')}
                      />
                    ) : (
                      <div className="text-center p-6">
                        <ImageIcon size={40} className="text-zinc-800 mx-auto mb-2" />
                        <p className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter italic">URL Vazia</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-[10px] font-cinzel text-zinc-400 uppercase tracking-widest">
                      <Wine size={12} className="text-[#c2410c]" /> Nome do Rótulo
                    </label>
                    <input
                      required
                      value={data.name || ''}
                      onChange={(e) => setData({ ...data, name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl focus:border-[#c2410c] outline-none font-serif italic"
                      placeholder="Ex: Pêra-Manca Tinto 2015"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-cinzel text-zinc-400 uppercase tracking-widest">Uva</label>
                      <input
                        value={data.uva || ''}
                        onChange={(e) => setData({ ...data, uva: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-[#c2410c] outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-cinzel text-zinc-400 uppercase tracking-widest flex items-center gap-2">Origem</label>
                      <input
                        value={data.origem || ''}
                        onChange={(e) => setData({ ...data, origem: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 p-3 rounded-xl focus:border-[#c2410c] outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-cinzel text-zinc-400 uppercase flex items-center gap-2">
                      <ImageIcon size={12} className="text-[#c2410c]" /> URL da Imagem
                    </label>
                    <input
                      value={data.image_url || ''}
                      onChange={(e) => setData({ ...data, image_url: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none text-[10px] font-mono text-[#c2410c]"
                      placeholder="/vinhos/nome.webp ou link HTTPS"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['Tinto', 'Branco', 'Rosé', 'Espumante'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setData({ ...data, category: cat })}
                      className={`py-3 rounded-xl text-[10px] font-cinzel uppercase transition-all border ${
                        (data.category || 'Tinto') === cat ? 'bg-[#c2410c] border-[#c2410c] text-white' : 'bg-white/5 border-white/10 text-zinc-500'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-cinzel text-zinc-500 uppercase flex items-center gap-1">
                      <Calendar size={10} /> Safra
                    </label>
                    <input
                      value={data.safra || ''}
                      onChange={(e) => setData({ ...data, safra: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-cinzel text-zinc-500 uppercase flex items-center gap-1">
                      <Star size={10} /> Pontos
                    </label>
                    <input
                      type="number"
                      value={data.pontuacao || ''}
                      onChange={(e) => setData({ ...data, pontuacao: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl outline-none text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-cinzel text-zinc-500 uppercase flex items-center gap-1">
                      <Box size={10} /> Stock
                    </label>
                    <input
                      type="number"
                      value={data.stock || ''}
                      onChange={(e) => setData({ ...data, stock: e.target.value })}
                      className="w-full bg-black/40 border border-white/5 p-3 rounded-xl outline-none text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <label className="text-[10px] font-cinzel text-zinc-400 uppercase flex items-center gap-2">
                    <DollarSign size={12} className="text-[#c2410c]" /> Valor de Venda
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={data.price || ''}
                    onChange={(e) => setData({ ...data, price: e.target.value })}
                    className="w-full bg-[#c2410c]/10 border border-[#c2410c]/30 p-4 rounded-xl outline-none text-[#c2410c] font-bold text-xl"
                  />
                </div>

                <div className="flex-1 p-4 rounded-2xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap size={16} className={data.emOferta ? 'text-orange-500' : 'text-zinc-600'} />
                    <span className="text-[11px] font-cinzel text-white uppercase">Status de Oferta</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setData({ ...data, emOferta: !data.emOferta })}
                    className={`w-12 h-6 rounded-full transition-colors relative ${data.emOferta ? 'bg-orange-500' : 'bg-zinc-800'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${data.emOferta ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#c2410c] hover:bg-white hover:text-[#c2410c] text-white py-6 rounded-2xl font-cinzel text-[11px] font-black uppercase tracking-[0.4em] transition-all shadow-xl active:scale-95"
              >
                {data._id ? 'Confirmar Alterações' : 'Finalizar Cadastro no Acervo'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
