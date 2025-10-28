export default function PersonalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {children}
        </div>
    );
}
