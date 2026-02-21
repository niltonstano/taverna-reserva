import { Activity, DollarSign, Droplet, FileText, Flame, Hash, Image as ImageIcon, MapPin, Package, Save, Scale, Star, Wine, X } from 'lucide-react';
import React, { useState } from 'react';
import { api } from '../../services/api';
import type { Product } from '../../types/admin';

const inputStyle =
  'w-full bg-white/[0.03] border border-white/10 p-2.5 rounded-xl focus:border-[#c2410c] focus:bg-white/[0.06] outline-none text-white transition-all placeholder:text-zinc-700 text-sm';
const labelStyle = 'text-[8px] uppercase tracking-widest text-zinc-500 ml-1 font-bold flex items-center gap-1.5 mb-1';
const wineStyles = ['Tinto', 'Branco', 'Rosé', 'Espumante', 'Sobremesa', 'Fortificado'];

export function AdminModal({
  isOpen,
  isEditing,
  product,
  onClose,
  onSave,
  onChange,
  resolveImagePath,
  categories,
}: {
  isOpen: boolean;
  isEditing: boolean;
  product: Product | any;
  onClose: () => void;
  onSave: () => void;
  onChange: (updatedProduct: any) => void;
  resolveImagePath: (item: any) => string;
  categories: string[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !product) return null;

  const handleDimensionChange = (dim: string, value: string) => {
    onChange({
      ...product,
      dimensions: { ...product.dimensions, [dim]: value === '' ? 0 : Number(value) },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      let categoriaFinal = product.category;
      if (categoriaFinal === 'Vinho' && product.type) categoriaFinal = `Vinho ${product.type}`;

      const payload = {
        name: product.name,
        category: categoriaFinal,
        type: product.type,
        uva: product.uva,
        description: product.description,
        price: Number(product.price || 0),
        stock: Number(product.stock || 0),
        origem: product.origem,
        safra: product.safra,
        pontuacao: Number(product.pontuacao || 0),
        imageUrl: product.image_url || product.imageUrl,
        weight: Number(product.weight || 0),
        dimensions: {
          length: Number(product.dimensions?.length || 0),
          height: Number(product.dimensions?.height || 0),
          width: Number(product.dimensions?.width || 0),
        },
        emOferta: !!product.emOferta,
        featured: !!product.featured,
        active: product.active !== false,
      };

      const id = product._id || product.id;
      isEditing && id ? await api.put(`/products/${id}`, payload) : await api.post('/products', payload);

      onSave();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao processar requisição.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isActive = product.active !== false;
  const isFeatured = !!product.featured;
  const isOnSale = !!product.emOferta;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0c0c0c] border border-white/10 rounded-[32px] w-full max-w-4xl shadow-2xl relative animate-in fade-in zoom-in duration-300 my-4">
        <div className="p-6 md:p-8">
          <button
            onClick={onClose}
            type="button"
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors z-10"
          >
            <X size={16} />
          </button>

          <header className="mb-5">
            <span className="text-[#c2410c] text-[8px] font-black uppercase tracking-[0.4em]">Curadoria Digital</span>
            <h2 className="font-serif italic text-2xl text-white mt-0.5">{isEditing ? 'Editar Registro' : 'Novo Rótulo'}</h2>
          </header>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-5">
            <div className="md:col-span-7 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <label className={labelStyle}>
                    <Wine size={10} /> Nome do Rótulo
                  </label>
                  <input
                    className={inputStyle}
                    value={product.name || ''}
                    onChange={(e) => onChange({ ...product, name: e.target.value })}
                    required
                  />
                </div>
                <div className="col-span-1">
                  <label className={labelStyle}>Categoria</label>
                  <select
                    className={inputStyle}
                    value={product.category || ''}
                    onChange={(e) => onChange({ ...product, category: e.target.value })}
                    required
                  >
                    <option value="" disabled>
                      Selecione...
                    </option>
                    {categories
                      .filter((c) => c !== 'Todos')
                      .map((cat) => (
                        <option key={cat} value={cat} className="bg-zinc-900 uppercase text-[10px]">
                          {cat.endsWith('s') && !['Tinto', 'Branco', 'Rosé'].includes(cat) ? cat.slice(0, -1) : cat}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>
                    <Droplet size={10} /> Estilo / Tipo
                  </label>
                  <select className={inputStyle} value={product.type || ''} onChange={(e) => onChange({ ...product, type: e.target.value })} required>
                    <option value="" disabled>
                      Corpo / Tipo...
                    </option>
                    {wineStyles.map((style) => (
                      <option key={style} value={style} className="bg-zinc-900">
                        {style}
                      </option>
                    ))}
                    <option value="Acessório" className="bg-zinc-900">
                      Acessório / Outro
                    </option>
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Uva Principal</label>
                  <input className={inputStyle} value={product.uva || ''} onChange={(e) => onChange({ ...product, uva: e.target.value })} />
                </div>
              </div>

              <div>
                <label className={labelStyle}>
                  <FileText size={10} /> Notas do Sommelier
                </label>
                <textarea
                  className={`${inputStyle} h-20 resize-none text-xs leading-relaxed`}
                  value={product.description || ''}
                  onChange={(e) => onChange({ ...product, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelStyle}>
                    <DollarSign size={10} /> Preço
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className={inputStyle}
                    value={product.price || 0}
                    onChange={(e) => onChange({ ...product, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelStyle}>
                    <Package size={10} /> Estoque
                  </label>
                  <input
                    type="number"
                    className={inputStyle}
                    value={product.stock || 0}
                    onChange={(e) => onChange({ ...product, stock: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className={labelStyle}>
                    <MapPin size={10} /> Origem
                  </label>
                  <input className={inputStyle} value={product.origem || ''} onChange={(e) => onChange({ ...product, origem: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>
                    <Hash size={10} /> Safra
                  </label>
                  <input
                    className={inputStyle}
                    value={product.safra || ''}
                    onChange={(e) => onChange({ ...product, safra: e.target.value })}
                    placeholder="Ex: 2018 ou N/V"
                  />
                </div>
                <div>
                  <label className={labelStyle}>
                    <Star size={10} /> Pontuação
                  </label>
                  <input
                    type="number"
                    className={inputStyle}
                    value={product.pontuacao || ''}
                    onChange={(e) => onChange({ ...product, pontuacao: e.target.value })}
                    placeholder="Ex: 95"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-5 space-y-4">
              <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <div className="w-full h-40 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 overflow-hidden mb-3">
                  <img
                    src={product.image_url || product.imageUrl || resolveImagePath(product)}
                    alt="Preview"
                    className="h-36 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/400x600/000000/c2410c?text=Sem+Imagem';
                    }}
                  />
                </div>
                <label className={labelStyle}>
                  <ImageIcon size={10} /> URL da Imagem
                </label>
                <input
                  className={`${inputStyle} text-[10px] p-2 font-mono`}
                  value={product.image_url || product.imageUrl || ''}
                  onChange={(e) => onChange({ ...product, image_url: e.target.value, imageUrl: e.target.value })}
                />
              </div>

              <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                <label className={labelStyle}>
                  <Scale size={10} /> Logística
                </label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <input
                    type="number"
                    step="0.01"
                    className={`${inputStyle} !p-2 text-center text-xs`}
                    value={product.weight || ''}
                    onChange={(e) => onChange({ ...product, weight: e.target.value })}
                    placeholder="Kg"
                  />
                  <input
                    type="number"
                    className={`${inputStyle} !p-2 text-center text-xs`}
                    value={product.dimensions?.length || ''}
                    onChange={(e) => handleDimensionChange('length', e.target.value)}
                    placeholder="C"
                  />
                  <input
                    type="number"
                    className={`${inputStyle} !p-2 text-center text-xs`}
                    value={product.dimensions?.height || ''}
                    onChange={(e) => handleDimensionChange('height', e.target.value)}
                    placeholder="A"
                  />
                  <input
                    type="number"
                    className={`${inputStyle} !p-2 text-center text-xs`}
                    value={product.dimensions?.width || ''}
                    onChange={(e) => handleDimensionChange('width', e.target.value)}
                    placeholder="L"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between bg-white/[0.02] p-2 rounded-xl border border-white/5 px-8">
                <button
                  type="button"
                  onClick={() => onChange({ ...product, emOferta: !isOnSale })}
                  className={`flex flex-col items-center gap-1 transition-all ${isOnSale ? 'text-orange-500 scale-110' : 'text-zinc-600'}`}
                >
                  <Flame size={16} /> <span className="text-[7px] font-black uppercase">Oferta</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...product, featured: !isFeatured })}
                  className={`flex flex-col items-center gap-1 transition-all ${isFeatured ? 'text-yellow-500 scale-110' : 'text-zinc-600'}`}
                >
                  <Star size={16} /> <span className="text-[7px] font-black uppercase">Destaque</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange({ ...product, active: !isActive })}
                  className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-green-500 scale-110' : 'text-red-600/70'}`}
                >
                  <Activity size={16} /> <span className="text-[7px] font-black uppercase">{isActive ? 'Ativo' : 'Off'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={onClose} className="flex-1 text-zinc-500 uppercase text-[9px] font-black tracking-[0.2em]">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-[#c2410c] text-white py-3 rounded-xl uppercase text-[9px] font-black tracking-[0.2em] hover:bg-orange-700 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={14} /> {isEditing ? 'Atualizar Rótulo' : 'Salvar no Acervo'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
