import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File, Trash2, FileText, Image, Eye, X } from "lucide-react";
import { documents, formatDate, type Document } from "@/lib/tauri";
import { open } from "@tauri-apps/plugin-dialog";

export default function Documents() {
  const [documentsList, setDocumentsList] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const list = await documents.list();
      setDocumentsList(list);
    } catch (error) {
      console.error("Failed to load documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [
          { name: "Documents", extensions: ["pdf", "png", "jpg", "jpeg"] },
        ],
      });

      if (!selected) return;

      setIsUploading(true);
      const fileName = selected.split(/[/\\]/).pop() || "document";
      const ext = fileName.split(".").pop()?.toLowerCase() || "";
      const docType = ["png", "jpg", "jpeg"].includes(ext) ? "image" : "pdf";

      await documents.upload(fileName, selected, docType, 2024);
      loadDocuments();
    } catch (error) {
      console.error("Failed to upload document:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await documents.delete(id);
      loadDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error);
    }
  };

  const getDocIcon = (type: string) => {
    switch (type) {
      case "image":
        return Image;
      case "pdf":
        return FileText;
      default:
        return File;
    }
  };

  const getDocColor = (type: string) => {
    switch (type) {
      case "image":
        return "bg-purple-100 text-purple-600";
      case "pdf":
        return "bg-red-100 text-red-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Store and manage your tax documents</p>
        </div>
        <button onClick={handleUpload} disabled={isUploading} className="btn btn-primary">
          {isUploading ? (
            <div className="spinner spinner-sm" />
          ) : (
            <>
              <Upload className="w-5 h-5" />
              Upload Document
            </>
          )}
        </button>
      </div>

      {/* Upload Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleUpload}
        className="card p-8 border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50/50 transition-colors cursor-pointer"
      >
        <div className="text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
          <p className="text-sm text-gray-400 mt-1">PDF, PNG, JPG up to 10MB</p>
        </div>
      </motion.div>

      {/* Documents Grid */}
      {documentsList.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documentsList.map((doc, index) => {
            const Icon = getDocIcon(doc.document_type);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="card p-4"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${getDocColor(doc.document_type)}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {doc.document_type.toUpperCase()} &bull; {formatDate(doc.created_at)}
                    </p>
                    {doc.tax_year && (
                      <span className="badge badge-primary mt-2">Tax Year {doc.tax_year}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="btn btn-ghost btn-sm flex-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="btn btn-ghost btn-sm text-danger-600 hover:bg-danger-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-500 mb-6">Upload your tax documents to keep them organized</p>
        </div>
      )}

      {/* Document Preview Modal */}
      <AnimatePresence>
        {selectedDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-gray-900">{selectedDoc.name}</h3>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 min-h-[400px] flex items-center justify-center bg-gray-100">
                {selectedDoc.document_type === "image" ? (
                  <img
                    src={`asset://${selectedDoc.file_path}`}
                    alt={selectedDoc.name}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>PDF preview not available</p>
                    <p className="text-sm mt-2">File: {selectedDoc.file_path}</p>
                  </div>
                )}
              </div>
              {selectedDoc.extracted_data && (
                <div className="p-4 border-t bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-2">Extracted Data</h4>
                  <pre className="text-sm text-gray-600 whitespace-pre-wrap">
                    {selectedDoc.extracted_data}
                  </pre>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
