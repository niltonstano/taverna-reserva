import { Save, Wine, X } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../../services/api';
import type { ToastType } from '../ui/Toast';
import { Toast } from '../ui/Toast';

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

    // Limpeza de Token (Padrão Sênior de Segurança)
    const rawToken = localStorage.getItem('@TavernaReserva:token');
    const token = rawToken ? rawToken.replace(/["']/g, '').trim() : null;

    if (!token) {
      setToast({ message: 'Sessão expirada. Faça login.', type: 'error' });
      return;
    }

    try {
      // ✅ Normalização do Payload para o Backend (Schema Mongoose)
      const imgPath = data.imageUrl || data.image_url || '';

      const payload = {
        name: data.name,
        price: Number(data.price),
        category: data.category || 'Tinto',
        uva: data.uva || '',
        safra: data.safra || '',
        origem: data.origem || '',
        image_url: imgPath,
        imageUrl: imgPath, // Duplicado para garantir persistência
        pontuacao: Number(data.pontuacao) || 0,
        stock: Number(data.stock) || 0,
        active: true,
        emOferta: Boolean(data.emOferta),
        featured: Boolean(data.featured),
        // Valores default para dimensões se não existirem
        dimensions: data.dimensions || { width: 10, height: 33, length: 10 },
        weight: data.weight || 1.5,
      };

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (data._id) {
        await api.put(`/products/${data._id}`, payload, config);
        setToast({ message: 'Rótulo atualizado com sucesso!', type: 'success' });
      } else {
        await api.post('/products', payload, config);
        setToast({ message: 'Novo vinho cadastrado na adega!', type: 'success' });
      }

      // Delay para o usuário ler o Toast antes de fechar
      setTimeout(() => {
        onSubmit();
        onClose();
        setToast(null);
      }, 1200);
    } catch (err: any) {
      console.error('Save Error:', err);
      setToast({ message: 'Erro ao salvar informações.', type: 'error' });
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Overlay com desfoque */}
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

          <div className="relative bg-[#0a0a0a] border border-white/10 w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#c2410c]/20 flex items-center justify-center">
                  <Wine className="text-[#c2410c]" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-serif italic text-white leading-tight">Curadoria de Rótulo</h2>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-1 font-bold">Gestão de Inventário Premium</p>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-zinc-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Grid 1: Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Nome do Vinho</label>
                  <input
                    required
                    value={data.name || ''}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 focus:border-[#c2410c]/50 transition-all outline-none text-white"
                    placeholder="Ex: Chateau Margaux"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Categoria / Tipo</label>
                  <select
                    value={data.category || 'Tinto'}
                    onChange={(e) => setData({ ...data, category: e.target.value })}
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 focus:border-[#c2410c]/50 transition-all outline-none text-white appearance-none"
                  >
                    <option value="Tinto">Tinto</option>
                    <option value="Branco">Branco</option>
                    <option value="Rosé">Rosé</option>
                    <option value="Espumante">Espumante</option>
                    <option value="Sobremesa">Sobremesa</option>
                  </select>
                </div>
              </div>

              {/* Grid 2: Detalhes Técnicos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Uva</label>
                  <input
                    value={data.uva || ''}
                    onChange={(e) => setData({ ...data, uva: e.target.value })}
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-sm outline-none text-white"
                    placeholder="Malbec"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Safra</label>
                  <input
                    value={data.safra || ''}
                    onChange={(e) => setData({ ...data, safra: e.target.value })}
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-sm outline-none text-white"
                    placeholder="2019"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.price || ''}
                    onChange={(e) => setData({ ...data, price: e.target.value })}
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-sm outline-none text-white"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Estoque</label>
                  <input
                    type="number"
                    value={data.stock || ''}
                    onChange={(e) => setData({ ...data, stock: e.target.value })}
                    className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 text-sm outline-none text-white"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Input de Imagem com Dica */}
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold ml-1">Caminho da Imagem</label>
                <input
                  value={data.imageUrl || data.image_url || ''}
                  onChange={(e) => setData({ ...data, imageUrl: e.target.value, image_url: e.target.value })}
                  className="w-full bg-white/5 p-4 rounded-2xl border border-white/10 focus:border-[#c2410c]/50 transition-all outline-none text-white text-sm"
                  placeholder="Ex: /vinhos/rioja.webp"
                />
                <p className="text-[9px] text-zinc-500 italic mt-1 ml-2">
                  Dica: Use o caminho relativo da pasta public (ex: /vinhos/nome-do-arquivo.webp)
                </p>
              </div>

              {/* Switch de Oferta / Destaque */}
              <div className="flex gap-8 py-4 px-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={data.emOferta || false}
                    onChange={(e) => setData({ ...data, emOferta: e.target.checked })}
                    className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-[#c2410c]"
                  />
                  <span className="text-xs uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors font-bold">
                    Em Oferta
                  </span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={data.featured || false}
                    onChange={(e) => setData({ ...data, featured: e.target.checked })}
                    className="w-5 h-5 rounded border-white/10 bg-white/5 checked:bg-[#c2410c]"
                  />
                  <span className="text-xs uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors font-bold">Destaque</span>
                </label>
              </div>

              {/* Botão de Ação */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full bg-[#c2410c] hover:bg-white hover:text-black text-white py-5 rounded-3xl font-bold uppercase tracking-[0.3em] text-[11px] transition-all duration-500 flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]"
                >
                  <Save size={18} />
                  {data._id ? 'Atualizar Reserva' : 'Cadastrar na Adega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
