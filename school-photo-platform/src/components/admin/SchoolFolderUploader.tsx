"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  FolderUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { findOrCreateClassroom } from "@/actions/admin/classroom-actions";
import { useUpload } from "@/hooks/use-upload";

type SchoolFolderUploaderProps = {
  schoolId: string;
};

type ClassGroup = {
  className: string;
  files: File[];
  classId?: string;
  status: "pending" | "uploading" | "success" | "error";
  uploaded: number;
  failed: number;
  error?: string;
};

type UploadPhase = "idle" | "parsing" | "uploading" | "complete";

export default function SchoolFolderUploader({
  schoolId,
}: SchoolFolderUploaderProps) {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [totalStats, setTotalStats] = useState({
    success: 0,
    failed: 0,
    total: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadFiles } = useUpload();

  /**
   * Parse folder structure and group files by class name
   */
  const parseFolderStructure = (files: File[]): ClassGroup[] => {
    const groups: Map<string, File[]> = new Map();

    for (const file of files) {
      // Skip hidden files and non-images
      if (file.name.startsWith(".") || !file.type.startsWith("image/")) {
        continue;
      }

      // Parse path:  SchoolFolder/ClassName/photo.jpg
      const pathParts = file.webkitRelativePath.split("/");

      // Determine class name from folder structure
      let className = "Общие";
      if (pathParts.length >= 3) {
        // SchoolFolder/ClassName/photo. jpg → ClassName
        className = pathParts[pathParts.length - 2];
      } else if (pathParts.length === 2) {
        // ClassName/photo.jpg → ClassName
        className = pathParts[0];
      }

      // Normalize class name
      className = className.trim();
      if (!className || className === "." || className === "..") {
        className = "Общие";
      }

      if (!groups.has(className)) {
        groups.set(className, []);
      }
      groups.get(className)!.push(file);
    }

    // Convert to array and sort by class name
    return Array.from(groups.entries())
      .map(([className, files]) => ({
        className,
        files,
        status: "pending" as const,
        uploaded: 0,
        failed: 0,
      }))
      .sort((a, b) => a.className.localeCompare(b.className, "ru"));
  };

  /**
   * Handle folder selection
   */
  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setPhase("parsing");

    // Parse folder structure
    const groups = parseFolderStructure(files);

    if (groups.length === 0) {
      alert("В выбранной папке не найдено изображений.");
      setPhase("idle");
      return;
    }

    setClassGroups(groups);
    setTotalStats({
      success: 0,
      failed: 0,
      total: groups.reduce((sum, g) => sum + g.files.length, 0),
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    // Start upload process
    await startUpload(groups);
  };

  /**
   * Start uploading all groups
   */
  const startUpload = async (groups: ClassGroup[]) => {
    setPhase("uploading");
    let totalSuccess = 0;
    let totalFailed = 0;
    const totalFiles = groups.reduce((sum, g) => sum + g.files.length, 0);
    let processedFiles = 0;

    const uploadPromises = groups.map(async (group, i) => {
      setClassGroups((prev) =>
        prev.map((g, idx) => (idx === i ? { ...g, status: "uploading" } : g)),
      );

      try {
        // Find or create classroom
        const classroom = await findOrCreateClassroom(
          schoolId,
          group.className,
        );

        // Update group with classId
        setClassGroups((prev) =>
          prev.map((g, idx) =>
            idx === i ? { ...g, classId: classroom.id } : g,
          ),
        );

        // Upload files
        const result = await uploadFiles(group.files, classroom.id, schoolId);

        // Update specific group status based on result
        setClassGroups((prev) =>
          prev.map((g, idx) =>
            idx === i
              ? {
                  ...g,
                  status: result.failedCount > 0 ? "error" : "success",
                  uploaded: result.uploadedCount,
                  failed: result.failedCount,
                }
              : g,
          ),
        );

        // Update local counters
        totalSuccess += result.uploadedCount;
        totalFailed += result.failedCount;
      } catch (error) {
        console.error(`Failed to process class ${group.className}:`, error);

        // Handle error state for this specific group
        setClassGroups((prev) =>
          prev.map((g, idx) =>
            idx === i
              ? {
                  ...g,
                  status: "error",
                  failed: group.files.length,
                  error: error instanceof Error ? error.message : String(error),
                }
              : g,
          ),
        );

        totalFailed += group.files.length;
      } finally {
        // Update progress regardless of success/failure
        processedFiles += group.files.length;

        setOverallProgress(Math.round((processedFiles / totalFiles) * 100));
        setTotalStats({
          total: totalFiles,
          success: totalSuccess,
          failed: totalFailed,
        });
      }
    });

    await Promise.all(uploadPromises);

    setPhase("complete");

    // Reload page after delay if successful
    if (totalSuccess > 0) {
      setTimeout(() => {
        window.location.reload();
      }, 4000);
    }
  };

  /**
   * Reset and start over
   */
  const handleReset = () => {
    setPhase("idle");
    setClassGroups([]);
    setCurrentGroupIndex(0);
    setOverallProgress(0);
    setTotalStats({ success: 0, failed: 0, total: 0 });
  };

  return (
    <div className="inline-block">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        /* @ts-ignore - Folder selection attributes */
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
      />

      {phase === "idle" && (
        <Button
          onClick={() => {
            if (
              confirm(
                'Выберите папку школы.\n\nВнутри должны быть папки с названиями классов (например:  "1А", "2Б", "11В").\n\nФайлы загружаются напрямую в облако — это быстрее и надёжнее.',
              )
            ) {
              fileInputRef.current?.click();
            }
          }}
          className="bg-slate-900 hover:bg-slate-800 text-white gap-2 h-9"
        >
          <FolderUp className="w-4 h-4" />
          Загрузить папку школы
        </Button>
      )}

      {/* Upload Dialog - ✅ ИСПРАВЛЕНО:  Используем Dialog вместо div */}
      <Dialog
        open={phase !== "idle"}
        onOpenChange={(open) => !open && phase === "complete" && handleReset()}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {phase === "complete" ? (
                <CheckCircle2 className="w-5 h-5 text-slate-900" />
              ) : (
                <Loader2 className="w-5 h-5 text-slate-900 animate-spin" />
              )}
              <span>
                {phase === "parsing" && "Анализ папок..."}
                {phase === "uploading" && "Загрузка фотографий"}
                {phase === "complete" && "Загрузка завершена"}
              </span>
            </DialogTitle>
            <DialogDescription>
              {phase === "parsing" && "Анализируем структуру папок..."}
              {phase === "uploading" && classGroups.length > 0 && (
                <>
                  Класс {currentGroupIndex + 1} из {classGroups.length}
                </>
              )}
              {phase === "complete" && (
                <>
                  Загружено {totalStats.success} из {totalStats.total} файлов
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Progress */}
          {phase !== "parsing" && (
            <div className="space-y-4">
              <Progress value={overallProgress} className="h-2" />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {totalStats.total}
                  </p>
                  <p className="text-xs text-slate-500">Всего</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {totalStats.success}
                  </p>
                  <p className="text-xs text-slate-500">Загружено</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-400">
                    {totalStats.failed}
                  </p>
                  <p className="text-xs text-slate-500">Ошибок</p>
                </div>
              </div>

              {/* Class Groups List */}
              <div className="max-h-60 overflow-y-auto space-y-2">
                {classGroups.map((group) => (
                  <div
                    key={group.className}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                      group.status === "uploading"
                        ? "border-slate-900 bg-slate-50"
                        : group.status === "success"
                          ? "border-slate-200 bg-slate-50"
                          : group.status === "error"
                            ? "border-red-200 bg-red-50"
                            : "border-slate-100 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FolderOpen
                        className={`w-4 h-4 ${
                          group.status === "success"
                            ? "text-slate-900"
                            : group.status === "error"
                              ? "text-red-500"
                              : "text-slate-400"
                        }`}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {group.className}
                        </p>
                        <p className="text-xs text-slate-500">
                          {group.files.length} файлов
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {group.status === "pending" && (
                        <span className="text-xs text-slate-400">Ожидание</span>
                      )}
                      {group.status === "uploading" && (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                      )}
                      {group.status === "success" && (
                        <span className="text-xs text-slate-900 font-medium">
                          ✓ {group.uploaded}
                        </span>
                      )}
                      {group.status === "error" && (
                        <span className="text-xs text-red-600">
                          {group.uploaded > 0
                            ? `${group.uploaded} / ${group.failed} ошибок`
                            : "Ошибка"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Warning */}
              {phase === "uploading" && (
                <Alert className="bg-amber-50 border-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-xs">
                    Не закрывайте страницу до завершения загрузки.
                  </AlertDescription>
                </Alert>
              )}

              {/* Complete message */}
              {phase === "complete" && totalStats.success > 0 && (
                <p className="text-center text-sm text-slate-500">
                  Страница обновится через несколько секунд...
                </p>
              )}
            </div>
          )}

          {/* Parsing state */}
          {phase === "parsing" && (
            <div className="py-8 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-slate-900 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                Анализируем структуру папок...
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
