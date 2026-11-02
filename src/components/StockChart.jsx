import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

function StockChart({ categories, colors }) {
  const totalStock = categories.reduce((total, category) => total + category.value, 0)

  return (
    <div className="tw-px-4 tw-pb-4">
      <div className="tw-relative tw-h-[190px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              dataKey="value"
              nameKey="name"
              innerRadius={58}
              outerRadius={78}
              paddingAngle={3}
              stroke="none"
            >
              {categories.map((category, index) => (
                <Cell key={category.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value} unidades`, name]}
              contentStyle={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                fontSize: 12,
                boxShadow: '0 8px 24px rgba(15,23,42,.08)',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="tw-pointer-events-none tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center">
          <span className="tw-text-2xl tw-font-bold tw-text-slate-800">{totalStock.toLocaleString('es-PE')}</span>
          <span className="tw-text-[10px] tw-font-medium tw-uppercase tw-tracking-wider tw-text-slate-400">unidades</span>
        </div>
      </div>
      <div className="tw-grid tw-grid-cols-2 tw-gap-x-3 tw-gap-y-2 tw-border-t tw-border-slate-100 tw-pt-3">
        {categories.map((category, index) => (
          <div key={category.name} className="tw-flex tw-min-w-0 tw-items-center tw-gap-2">
            <span className="tw-h-2 tw-w-2 tw-shrink-0 tw-rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
            <span className="tw-truncate tw-text-[11px] tw-text-slate-500">{category.name}</span>
            <span className="tw-ml-auto tw-text-[11px] tw-font-semibold tw-text-slate-700">{category.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StockChart
