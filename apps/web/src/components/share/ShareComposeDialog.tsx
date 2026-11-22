import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, KeyRound, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalShell } from "@/components/ui/modal-shell";
import {
  SHARE_TTL_DEFAULT,
  SHARE_TTL_PRESETS,
  clampShareTtl,
  previewExpiresAt,
  formatWipeTime,
} from "@/lib/share/ttl";
import { getSettings } from "@/lib/storage";

export type ShareComposeMode = "create" | "replace";

export type ShareComposeConfirm = {
  mode: ShareComposeMode;
  password: string;
  ttlSeconds: number;
  viewProtected: boolean;
};

type Props = {
  open: boolean;
  title?: string;
  filename?: string | null;
  /** Existing remote share id bound to this file/project */
  existingShareId?: string | null;
  /** Last password used for that share (local) */
  existingPassword?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onConfirm: (opts: ShareComposeConfirm) => void;
};

export function ShareComposeDialog({
  open,
  title = "Share",
  filename,
  existingShareId,
  existingPassword,
  submitting = false,
  onClose,
  onConfirm,
}: Props) {
  const defaultPassword = getSettings()?.defaultSharePassword ?? "";
  const [mode, setMode] = useState<ShareComposeMode>("create");
  const [password, setPassword] = useState(defaultPassword);
  const [ttlSeconds, setTtlSeconds] = useState(SHARE_TTL_DEFAULT);
  const [viewProtected, setViewProtected] = useState(false);
  const [customTtl, setCustomTtl] = useState("");

  useEffect(() => {
    if (!open) return;
    const settingsPw = getSettings()?.defaultSharePassword ?? "";
    setPassword(existingPassword || settingsPw);
    setTtlSeconds(SHARE_TTL_DEFAULT);
    setCustomTtl("");
    setViewProtected(false);
    setMode(existingShareId ? "replace" : "create");
  }, [open, existingShareId, existingPassword]);

  const wipePreview = useMemo(
    () => formatWipeTime(previewExpiresAt(ttlSeconds)),
    [ttlSeconds],
  );

  const noPassword = !password.trim();
  const protectDisabled = noPassword;

  return (
    <ModalShell open={open} onClose={onClose} title={title} className="max-w-lg">
      <div className="flex items-start gap-3 mb-4 pr-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Share2 className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground truncate">
            {filename ? filename : "Markdown document"}
          </p>
        </div>
      </div>

      {existingShareId && (
        <div className="mb-4 space-y-2">
          <p className="text-xs text-muted-foreground font-mono truncate">
            Bound share: {existingShareId}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "replace" ? "default" : "outline"}
              onClick={() => setMode("replace")}
              disabled={submitting}
            >
              Update existing
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "create" ? "default" : "outline"}
              onClick={() => setMode("create")}
              disabled={submitting}
            >
              New link
            </Button>
          </div>
          {mode === "replace" && (
            <p className="text-xs text-muted-foreground">
              Replaces content on the same id. Wipe time stays the same on the
              server.
            </p>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <label className="text-sm font-medium" htmlFor="share-compose-password">
              Share password
            </label>
            <Link
              to="/settings#password"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              <KeyRound className="w-3 h-3" />
              Settings
            </Link>
          </div>
          <input
            id="share-compose-password"
            type="password"
            autoComplete="off"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting || mode === "replace"}
            placeholder={mode === "replace" ? "Using bound password" : "Required for update/delete"}
            className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
          />
          {mode === "replace" && (
            <p className="text-xs text-muted-foreground mt-1">
              Password is fixed for this share id (set at create).
            </p>
          )}
        </div>

        {mode === "create" && (
          <div>
            <label className="text-sm font-medium mb-2 block">Link lifetime</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {SHARE_TTL_PRESETS.map((p) => (
                <Button
                  key={p.seconds}
                  type="button"
                  size="sm"
                  variant={ttlSeconds === p.seconds && !customTtl ? "default" : "outline"}
                  onClick={() => {
                    setCustomTtl("");
                    setTtlSeconds(p.seconds);
                  }}
                  disabled={submitting}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <input
              type="number"
              min={60}
              max={SHARE_TTL_DEFAULT * 5}
              placeholder="Custom seconds (≤ 30d)"
              value={customTtl}
              onChange={(e) => {
                setCustomTtl(e.target.value);
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n)) setTtlSeconds(clampShareTtl(n));
              }}
              disabled={submitting}
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Wipes around: {wipePreview}
            </p>
          </div>
        )}

        <label
          className={`flex items-start gap-2 text-sm ${protectDisabled ? "opacity-60" : ""}`}
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={viewProtected && !protectDisabled}
            disabled={submitting || protectDisabled || mode === "replace"}
            onChange={(e) => setViewProtected(e.target.checked)}
          />
          <span>
            Protect view (require password to open)
            {protectDisabled && (
              <span className="block text-xs text-muted-foreground">
                Set a share password first — or open{" "}
                <Link
                  to="/settings#password"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Settings → Password
                </Link>
                .
              </span>
            )}
          </span>
        </label>

        {(noPassword || (!viewProtected && mode === "create")) && (
          <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              {noPassword
                ? "No password — anyone with the link can view; you won’t be able to update or delete this share remotely."
                : "View is public — anyone with the link can read the markdown until wipe time."}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={submitting || (mode === "replace" && !password.trim())}
          onClick={() =>
            onConfirm({
              mode,
              password: password.trim(),
              ttlSeconds: clampShareTtl(ttlSeconds),
              viewProtected: viewProtected && !noPassword,
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
    </ModalShell>
  );
}
