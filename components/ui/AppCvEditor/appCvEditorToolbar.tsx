import { CvModel, CvTemplate } from "@/lib/cvModel";
import { Button } from '@/components/ui/button';
import { useCallback } from "react";
import { Printer } from "lucide-react";

type AppAppCvEditorToolbarProps = {
    model: CvModel;
    onChange: (model: CvModel) => void;
};

export default function AppCvEditorToolbar({ model, onChange }: AppAppCvEditorToolbarProps) {
    // Print handler
    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    return <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-lg shadow">
        <div className="flex gap-2">
            {
                [
                    'modern',
                    'classic',
                    'minimal'
                ].map(
                    template => <Button
                        key={template}
                        variant={model.templateId === template ? 'default' : 'outline'}
                        onClick={() => onChange({ ...model, templateId: template as CvTemplate })}
                    >
                        {template}
                    </Button>
                )
            }
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
            </Button>
        </div>
    </div>
}