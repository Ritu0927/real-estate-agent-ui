type Props = {
  title: string;
  children: React.ReactNode;
};

export default function DashboardCard({
  title,
  children,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-bold text-lg mb-3">
        {title}
      </h2>

      {children}
    </div>
  );
}