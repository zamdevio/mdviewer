import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

export function DeleteWarningDialog({
    show,
    fileName,
    onConfirm,
    onCancel,
}: {
    show: boolean;
    fileName: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const display = fileName
        ? fileName.endsWith(".md")
            ? fileName
            : `${fileName}.md`
        : null;

    return (
        <ConfirmDeleteDialog
            open={show}
            title="Delete file"
            name={display}
            onConfirm={onConfirm}
            onCancel={onCancel}
        />
    );
}
