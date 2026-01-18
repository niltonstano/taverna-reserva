import { Mail, Plus, RefreshCw, ShieldCheck, Trash2, Users, Wine } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ProductModal } from '../../components/products/ProductModal';
import { ProductTable } from '../../components/products/ProductTable';
import { api } from '../../services/api';

type Tab = 'vinhos' | 'clientes';

export function AdminDashboard() {
  const [products, setProducts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('vinhos');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Busca de Vinhos
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Erro ao buscar vinhos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca de Clientes (Usuários)
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Ajuste o endpoint conforme sua API (ex: /users ou /admin/users)
      const response = await api.get('/users');
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'vinhos') fetchProducts();
    if (activeTab === 'clientes') fetchUsers();
  }, [activeTab, fetchProducts, fetchUsers]);

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans pt-24">
      {/* Background Decorativo */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#c2410c]/10 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-4xl font-serif italic text-[#c2410c]">Painel de Controle</h2>
            <p className="text-zinc-500 font-cinzel text-[10px] uppercase tracking-[0.3em] mt-2">
              Gestão de {activeTab === 'vinhos' ? `${products.length} Rótulos` : `${users.length} Membros`}
            </p>
          </div>

          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveTab('vinhos')}
              className={`px-6 py-2 rounded-xl flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'vinhos' ? 'bg-[#c2410c] text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Wine size={14} /> Adega
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-6 py-2 rounded-xl flex items-center gap-2 font-cinzel text-[10px] uppercase tracking-widest transition-all ${
                activeTab === 'clientes' ? 'bg-[#c2410c] text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              <Users size={14} /> Clientes
            </button>
          </div>

          {activeTab === 'vinhos' && (
            <button
              onClick={() => {
                setSelectedProduct({
                  name: '',
                  price: '',
                  category: 'Tinto',
                  description: '',
                  uva: '',
                  safra: '',
                  origem: '',
                  image_url: '',
                  stock: 1,
                  emOferta: false,
                });
                setIsModalOpen(true);
              }}
              className="bg-white text-black hover:bg-[#c2410c] hover:text-white px-8 py-3 rounded-xl font-cinzel text-[10px] font-black uppercase transition-all shadow-xl"
            >
              <Plus size={16} className="inline mr-2" /> Novo Rótulo
            </button>
          )}
        </header>

        <main className="bg-white/[0.02] border border-white/5 rounded-[40px] overflow-hidden min-h-[500px] backdrop-blur-md relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <RefreshCw className="animate-spin text-[#c2410c]" size={32} />
              <p className="font-cinzel text-[10px] text-[#c2410c] animate-pulse uppercase tracking-widest">Sincronizando Banco...</p>
            </div>
          ) : activeTab === 'vinhos' ? (
            /* TABELA DE VINHOS */
            products.length > 0 ? (
              <ProductTable
                products={products}
                onEdit={(p) => {
                  setSelectedProduct({
                    ...p,
                    image_url: p.image_url || p.image || '',
                    description: p.description || p.descricao || '',
                    stock: p.stock ?? 0,
                    emOferta: Boolean(p.emOferta),
                  });
                  setIsModalOpen(true);
                }}
                onRefresh={fetchProducts}
              />
            ) : (
              <EmptyState message="Nenhum rótulo encontrado na adega." />
            )
          ) : (
            /* LISTA DE CLIENTES */
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.length > 0 ? (
                  users.map((client: any) => (
                    <div
                      key={client._id}
                      className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-[#c2410c]/40 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-[#c2410c]">
                          <Users size={24} />
                        </div>
                        {client.isAdmin && (
                          <span className="flex items-center gap-1 text-[8px] bg-[#c2410c]/20 text-[#c2410c] px-2 py-1 rounded-full font-black uppercase">
                            <ShieldCheck size={10} /> Admin
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif text-xl italic text-white group-hover:text-[#c2410c] transition-colors">{client.name}</h4>
                      <div className="flex items-center gap-2 text-zinc-500 mt-2">
                        <Mail size={12} />
                        <span className="text-xs truncate">{client.email}</span>
                      </div>
                      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                        <span className="text-[9px] text-zinc-600 uppercase font-cinzel">
                          Membro desde: {new Date(client.createdAt).toLocaleDateString()}
                        </span>
                        {/* Botão de excluir cliente (opcional) */}
                        {!client.isAdmin && (
                          <button className="text-zinc-700 hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center text-zinc-500 italic font-serif text-lg">
                    Nenhum cliente cadastrado até o momento.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedProduct}
        setData={setSelectedProduct}
        onSubmit={fetchProducts}
      />
    </div>
  );
}

// Subcomponente para estados vazios
function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-40 text-center text-zinc-500">
      <Wine size={48} className="mb-4 opacity-20" />
      <p className="italic font-serif text-lg">{message}</p>
    </div>
  );
}
