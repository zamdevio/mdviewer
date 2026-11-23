import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  Share2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  SHARE_TTL_DEFAULT,
  SHARE_TTL_MAX,
  SHARE_TTL_MIN,
  SHARE_TTL_PRESETS,
  clampShareTtl,
  previewExpiresAt,
  formatWipeTime,
  generateSharePassword,
} from "@/lib/share/ttl";
import { getSettings, updateSetting } from "@/lib/storage";
import { fetchCompatibility } from "@/lib/api";
import { getEffectiveApiConfig } from "@/lib/config";

export type ShareComposeMode = "create" | "replace";

export type ShareComposeConfirm = {
  mode: ShareComposeMode;
  /** Disposable view password when viewProtected */
  viewPassword: string;
  ttlSeconds: number;
  viewProtected: boolean;
};

type Props = {
  open: boolean;
  title?: string;
  filename?: string | null;
  /** Existing remote share id bound to this file/project */
  existingShareId?: string | null;
  /** Last view password stored locally for that share */
  existingViewPassword?: string | null;
  /** Known wipe time for bound share (PUT does not slide it). */
  existingExpiresAt?: string | null;
  /** When false (e.g. Shares page without file content), Update is disabled. */
  allowMutate?: boolean;
  /** Why Update is disabled when allowMutate is false. */
  mutateDisabledReason?: string | null;
  submitting?: boolean;
  deleting?: boolean;
  onClose: () => void;
  onConfirm: (opts: ShareComposeConfirm) => void;
  /** Delete remote + local share binding (not Files/Editor body). */
  onDeleteShare?: () => void | Promise<void>;
};

export function ShareComposeDialog({
  open,
  title = "Share",
  filename,
  existingShareId,
  existingViewPassword,
  existingExpiresAt,
  allowMutate = true,
  mutateDisabledReason = null,
  submitting = false,
  deleting = false,
  onClose,
  onConfirm,
  onDeleteShare,
}: Props) {
  const [mode, setMode] = useState<ShareComposeMode>("create");
  const [manageToken, setManageToken] = useState(
    () => getSettings()?.manageToken ?? "",
  );
  const [viewPassword, setViewPassword] = useState("");
  const [ttlSeconds, setTtlSeconds] = useState(SHARE_TTL_DEFAULT);
  const [ttlMin, setTtlMin] = useState(SHARE_TTL_MIN);
  const [ttlMax, setTtlMax] = useState(SHARE_TTL_MAX);
  const [viewProtected, setViewProtected] = useState(false);
  const [customTtl, setCustomTtl] = useState("");

  useEffect(() => {
    if (!open) return;
    const token = getSettings()?.manageToken ?? "";
    setManageToken(token);
    setViewPassword(existingViewPassword || "");
    setTtlSeconds(SHARE_TTL_DEFAULT);
    setCustomTtl("");
    setViewProtected(Boolean(existingViewPassword));
    setMode(existingShareId && allowMutate ? "replace" : "create");

    let cancelled = false;
    void (async () => {
      try {
        const compat = await fetchCompatibility();
        if (cancelled || !compat.ttl) return;
        setTtlMin(compat.ttl.minSeconds);
        setTtlMax(compat.ttl.maxSeconds);
        setTtlSeconds(compat.ttl.defaultSeconds);
      } catch {
        /* keep local defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, existingShareId, existingViewPassword, allowMutate]);

  const wipePreview = useMemo(
    () => formatWipeTime(previewExpiresAt(ttlSeconds)),
    [ttlSeconds],
  );

  const noManageToken = !manageToken.trim();
  const frontendShareUrl = existingShareId
    ? `${getEffectiveApiConfig().FRONTEND_URL}/share/${encodeURIComponent(existingShareId)}`
    : null;

  const ensureManageToken = () => {
    const next = generateSharePassword(24);
    updateSetting("manageToken", next);
    setManageToken(next);
  };

  const onToggleProtect = (checked: boolean) => {
    setViewProtected(checked);
    if (checked && !viewPassword.trim()) {
      setViewPassword(generateSharePassword(16));
    }
  };

  const busy = submitting || deleting;

  return (
    <ModalShell open={open} onClose={onClose} title={title} className="max-w-lg">
      <div className="flex items-start gap-3 mb-4 pr-6">
        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
          <Share2 className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {filename ? filename : "Markdown document"}
          </p>
        </div>
      </div>

      {noManageToken && (
        <div className="mb-4 flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p>
              A manage token is required to create or update shares. Stored only
              in this browser.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                onClick={ensureManageToken}
                disabled={busy}
              >
                Auto-generate token
              </Button>
              <Button type="button" size="sm" variant="outline" asChild>
                <Link to="/settings#token" target="_blank" rel="noopener noreferrer">
                  <KeyRound className="w-3 h-3 mr-1" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {existingShareId && frontendShareUrl && (
          <div className="space-y-2 rounded-md border border-border/60 p-3">
            <label className="text-sm font-medium block">Shared link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 rounded-md border border-input bg-muted/50 text-sm font-mono break-all min-h-[2.5rem] flex items-center">
                {frontendShareUrl}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-shrink-0 gap-1"
                disabled={busy}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(frontendShareUrl);
                  } catch {
                    /* ignore */
                  }
                }}
              >
                <Copy className="w-3 h-3" />
                Copy
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" className="gap-1" asChild>
                <a href={frontendShareUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3" />
                  Open
                </a>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "replace" ? "default" : "outline"}
                onClick={() => setMode("replace")}
                disabled={busy || !allowMutate || noManageToken}
              >
                Update same link
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "create" ? "default" : "outline"}
                onClick={() => setMode("create")}
                disabled={busy || noManageToken}
              >
                New link
              </Button>
              {onDeleteShare && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={busy || noManageToken}
                  onClick={() => void onDeleteShare()}
                  className="gap-1"
                >
                  {deleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Delete
                </Button>
              )}
            </div>
            {!allowMutate && (
              <p className="text-xs text-muted-foreground">
                {mutateDisabledReason ||
                  "Open this file in the Editor to update content on the same link."}
              </p>
            )}
            {existingExpiresAt && (
              <p className="text-xs text-muted-foreground">
                Wipes: {new Date(existingExpiresAt).toLocaleString()}
                {mode === "replace" ? " (PUT does not extend this)" : ""}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Delete removes the remote object and this browser’s Shares record.
              Files / Editor content stay put.
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Mutate uses your{" "}
          <Link
            to="/settings#token"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            manage token
          </Link>
          . View password is optional and disposable per share.
        </p>

        {mode === "create" && (
          <div>
            <label className="text-sm font-medium mb-2 block">Link lifetime</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SHARE_TTL_PRESETS.map((p) => (
                <Button
                  key={p.seconds}
                  type="button"
                  size="sm"
                  variant={
                    ttlSeconds === p.seconds && !customTtl ? "default" : "outline"
                  }
                  onClick={() => {
                    setCustomTtl("");
                    setTtlSeconds(clampShareTtl(p.seconds));
                  }}
                  disabled={busy}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <input
              type="number"
              min={ttlMin}
              max={ttlMax}
              placeholder={`Custom seconds (${ttlMin}–${ttlMax})`}
              value={customTtl}
              onChange={(e) => {
                setCustomTtl(e.target.value);
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n)) setTtlSeconds(clampShareTtl(n));
              }}
              disabled={busy}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Wipes around: {wipePreview}
            </p>
          </div>
        )}

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={viewProtected}
            disabled={busy}
            onChange={(e) => onToggleProtect(e.target.checked)}
          />
          <span>Protect view (require disposable password to open)</span>
        </label>

        {viewProtected && (
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label
                className="text-sm font-medium"
                htmlFor="share-compose-view-password"
              >
                View password
              </label>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => setViewPassword(generateSharePassword(16))}
              >
                Rotate view password
              </Button>
            </div>
            <input
              id="share-compose-view-password"
              type="text"
              autoComplete="off"
              value={viewPassword}
              onChange={(e) => setViewPassword(e.target.value)}
              disabled={busy}
              placeholder="Auto-generated when protect is on"
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm font-mono"
            />
          </div>
        )}

        {!viewProtected && mode === "create" && (
          <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              View is public — anyone with the link can read until wipe time.
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={
              busy ||
              noManageToken ||
              (mode === "replace" && !allowMutate) ||
              (viewProtected && !viewPassword.trim())
            }
            onClick={() =>
              onConfirm({
                mode,
                viewPassword: viewProtected ? viewPassword.trim() : "",
                ttlSeconds: clampShareTtl(ttlSeconds),
                viewProtected: viewProtected && Boolean(viewPassword.trim()),
              })
            }
            className="gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Working…
              </>
            ) : mode === "replace" ? (
              "Update share"
            ) : (
              "Create link"
            )}
          </Button>
        </div>
      </div>
    </ModalShell>
  );
}
