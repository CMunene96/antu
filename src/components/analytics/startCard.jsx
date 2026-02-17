function StatCard({ title, value, icon, color = 'blue' }) {
  return (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 border-${color}-600`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        {icon && <div className="text-4xl">{icon}</div>}
      </div>
    </div>
  );
}

export default StatCard;