import { ExternalLink, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import { getEffectiveApiConfig } from "@/lib/config";
import {
  partitionRotateFails,
  type RotateFail,
} from "@/lib/share/rotate-manage";

export type RotateManageResults = {
  updated: string[];
  failed: RotateFail[];
  /** Whether Settings already wrote the new manage token. */
  tokenPersisted: boolean;
};

type Props = {
  open: boolean;
  results: RotateManageResults | null;
  onClose: () => void;
  /** Remove tombstone share ids from local bindings. */
  onPruneLocal: (shareIds: string[]) => void;
};

function shareUrl(id: string): string {
  const { FRONTEND_URL } = getEffectiveApiConfig();
  return `${FRONTEND_URL}/share/${encodeURIComponent(id)}`;
}

export function RotateManageResultsDialog({
  open,
  results,
  onClose,
  onPruneLocal,
}: Props) {
  if (!results) return null;

  const { updated, failed, tokenPersisted } = results;
  const { tombstones, live } = partitionRotateFails(failed);

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title="Manage token rotate results"
      className="max-w-lg"
    >
      <div className="flex items-start gap-3 mb-3 pr-6">
        {live.length > 0 ? (
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
        )}
        <div className="space-y-1 min-w-0">
          <h3 className="font-semibold text-lg">Rotate results</h3>
          <p className="text-sm text-muted-foreground">
            Updated {updated.length} · failed {failed.length}
            {tombstones.length > 0 ? ` (${tombstones.length} gone/expired)` : ""}
            {live.length > 0 ? ` · ${live.length} not re-keyed` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            {tokenPersisted
              ? "New manage token is saved in this browser."
              : "Previous manage token kept — nothing was re-keyed to the new secret."}
          </p>
          {live.length > 0 && (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              Not re-keyed usually means that id never matched your previous manage
              token (foreign/orphan). View it or remove it from the local list.
            </p>
          )}
        </div>
      </div>

      <div className="max-h-[min(50vh,360px)] overflow-y-auto space-y-4 border rounded-md p-3 bg-muted/20">
        {updated.length > 0 && (
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Rotated
            </h4>
            <ul className="space-y-2">
              {updated.map((id) => (
                <ResultRow key={`ok-${id}`} id={id} tone="ok" detail="re-keyed" />
              ))}
            </ul>
          </section>
        )}

        {failed.length > 0 && (
          <section>
            <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
              Failed
            </h4>
            <ul className="space-y-2">
              {failed.map((f) => (
                <ResultRow
                  key={`fail-${f.id}`}
                  id={f.id}
                  tone="fail"
                  detail={f.error}
                />
              ))}
            </ul>
          </section>
        )}

        {updated.length === 0 && failed.length === 0 && (
          <p className="text-sm text-muted-foreground">No share ids were submitted.</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {tombstones.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onPruneLocal(tombstones.map((t) => t.id));
              onClose();
            }}
            className="w-full"
          >
            Remove {tombstones.length} gone/expired from local list
          </Button>
        )}
        {live.length > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onPruneLocal(live.map((t) => t.id));
              onClose();
            }}
            className="w-full"
          >
            Remove {live.length} not-re-keyed from local list
          </Button>
        )}
        <Button type="button" onClick={onClose} className="w-full">
          Done
        </Button>
      </div>
    </ModalShell>
  );
}

function ResultRow({
  id,
  tone,
  detail,
}: {
  id: string;
  tone: "ok" | "fail";
  detail: string;
}) {
  const url = shareUrl(id);
  return (
    <li className="flex items-start gap-2 text-sm">
      {tone === "ok" ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-mono text-xs truncate" title={id}>
          {id}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <Button type="button" size="sm" variant="outline" className="flex-shrink-0 gap-1" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="w-3 h-3" />
          View
        </a>
      </Button>
    </li>
  );
}
