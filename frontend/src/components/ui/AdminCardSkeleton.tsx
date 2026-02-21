export const AdminCardSkeleton = () => (
  <div className="p-4 rounded-[24px] bg-zinc-900/40 border border-white/5 animate-pulse shadow-xl backdrop-blur-sm">
    <div className="flex items-center gap-4">
      {/* Placeholder da Imagem */}
      <div className="w-16 h-20 bg-white/5 rounded-xl shrink-0" />

      {/* Placeholder dos Textos */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center gap-2">
          {/* Categoria */}
          <div className="h-2 w-16 bg-[#c2410c]/20 rounded-full" />
          {/* Estoque */}
          <div className="h-2 w-8 bg-white/5 rounded-full" />
        </div>
        {/* Título (Vinho) */}
        <div className="h-4 w-3/4 bg-white/10 rounded-lg" />
        {/* Preço/Email */}
        <div className="h-3 w-1/4 bg-white/5 rounded-md" />
      </div>

      {/* Placeholder dos Botões Laterais */}
      <div className="flex flex-col gap-2">
        <div className="w-9 h-9 bg-white/5 rounded-xl" />
        <div className="w-9 h-9 bg-white/5 rounded-xl" />
      </div>
    </div>
  </div>
);
