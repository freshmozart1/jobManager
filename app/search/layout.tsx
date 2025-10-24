export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return (
        <section className="grid grid-cols-1 gap-4 h-full w-full">
            {children}
        </section>
    );
}