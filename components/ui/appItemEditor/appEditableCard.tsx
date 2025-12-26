import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";

type AppEditableCardProps = {
    title: ReactNode;
    description?: ReactNode;
    meta?: ReactNode;
    children?: ReactNode;

    editAriaLabel: string;
    deleteAriaLabel: string;

    onEdit: () => void;
    onDelete: () => void;

    disabled?: boolean;
    headerClassName?: string;
    contentClassName?: string;
};

export default function AppEditableCard({
    title,
    description,
    meta,
    children,
    editAriaLabel,
    deleteAriaLabel,
    onEdit,
    onDelete,
    disabled,
    headerClassName,
    contentClassName,
}: AppEditableCardProps) {
    return (
        <Card>
            <CardHeader className={headerClassName ?? "space-y-1"}>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <CardTitle className="text-base">{title}</CardTitle>
                        {description ? <CardDescription>{description}</CardDescription> : null}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" aria-label={editAriaLabel} onClick={onEdit} disabled={disabled}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label={deleteAriaLabel} onClick={onDelete} disabled={disabled}>
                            <Trash className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
                {meta}
            </CardHeader>

            {children ? <CardContent className={contentClassName}>{children}</CardContent> : null}
        </Card>
    );
}
