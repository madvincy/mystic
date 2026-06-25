// src/components/admin/BlogManagement.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import CodeBlock from "@tiptap/extension-code-block";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Calendar,
  User,
  Tag,
  FileText,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon2,
  Table as TableIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo,
  Redo,
  Save,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";
import { Button } from "@/components/shadCn/ui/button";
import { Input } from "@/components/shadCn/ui/input";
import { Badge } from "@/components/shadCn/ui/badge";
import { Card, CardContent } from "@/components/shadCn/ui/card";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/shadCn/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/shadCn/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadCn/ui/select";
import { Label } from "@/components/shadCn/ui/label";
import { Textarea } from "@/components/shadCn/ui/textarea";
import { Switch } from "@/components/shadCn/ui/switch";
import { cn } from "@/lib/utils";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string;
  author_id: string;
  author_name: string;
  status: "draft" | "published" | "archived";
  views: number;
  reading_time: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  is_featured: boolean;
  categories?: BlogCategory[];
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface ToolbarItem {
  icon: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string;
      titleId?: string;
    } & React.RefAttributes<SVGSVGElement>
  >;
  action: () => void;
  isActive?: boolean;
  title: string;
}

interface ToolbarGroup {
  group: string;
  items: ToolbarItem[];
}

const ToolbarButton = ({
  isActive,
  onClick,
  children,
  title,
}: {
  isActive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
      isActive &&
        "bg-gray-200 dark:bg-gray-700 text-pink-600 dark:text-pink-400",
    )}
    title={title}
  >
    {children}
  </button>
);

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDialog, setShowDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<Partial<BlogPost>>({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const imageUploadRef = useRef<HTMLInputElement>(null);

  const itemsPerPage = 10;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-pink-600 hover:underline" },
      }),
      Placeholder.configure({
        placeholder: "Write your blog post content here...",
      }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight,
      Typography,
      CodeBlock,
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: editingPost.content || "",
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base lg:prose-lg max-w-none focus:outline-none min-h-[400px] p-4",
      },
    },
    onUpdate: ({ editor }) => {
      setEditingPost({ ...editingPost, content: editor.getHTML() });
    },
  });

  useEffect(() => {
    if (editor && editingPost.content !== editor.getHTML()) {
      editor.commands.setContent(editingPost.content || "");
    }
  }, [editingPost.content, editor]);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  // ✅ FIXED: Fetch posts without nested relationship
  const fetchPosts = async () => {
    setLoading(true);
    try {
      // First, fetch all posts
      const { data: postsData, error: postsError } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get all post IDs
      const postIds = postsData.map((post) => post.id);

      // Fetch categories for these posts
      const { data: postCategoriesData, error: categoriesError } =
        await supabase
          .from("blog_post_categories")
          .select("post_id, category_id")
          .in("post_id", postIds);

      if (categoriesError) {
        console.error("Error fetching post categories:", categoriesError);
        setPosts(postsData);
        setLoading(false);
        return;
      }

      // Get all category IDs
      const categoryIds =
        postCategoriesData?.map((pc) => pc.category_id).filter(Boolean) || [];
      const uniqueCategoryIds = [...new Set(categoryIds)];

      // Fetch category details
      let categoryMap: Record<
        string,
        { id: string; name: string; slug: string }
      > = {};

      if (uniqueCategoryIds.length > 0) {
        const { data: categoriesData, error: catError } = await supabase
          .from("categories")
          .select("id, name, slug")
          .in("id", uniqueCategoryIds);

        if (!catError && categoriesData) {
          categoryMap = categoriesData.reduce(
            (acc, cat) => {
              acc[cat.id] = cat;
              return acc;
            },
            {} as Record<string, { id: string; name: string; slug: string }>,
          );
        }
      }

      // Map categories to posts
      const postCategoryMap = postCategoriesData?.reduce(
        (acc, pc) => {
          if (!acc[pc.post_id]) {
            acc[pc.post_id] = [];
          }
          if (pc.category_id && categoryMap[pc.category_id]) {
            acc[pc.post_id].push(categoryMap[pc.category_id]);
          }
          return acc;
        },
        {} as Record<string, { id: string; name: string; slug: string }[]>,
      );

      // Merge data
      const transformedPosts = postsData.map((post) => ({
        ...post,
        categories: postCategoryMap?.[post.id] || [],
      }));

      setPosts(transformedPosts);
    } catch (error: any) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch posts: " + error.message);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error("Error fetching categories:", error);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `blog-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("blog-images")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("blog-images").getPublicUrl(fileName);

      if (editor) {
        editor.chain().focus().setImage({ src: publicUrl }).run();
      }

      toast.success("Image uploaded successfully");
    } catch (error: any) {
      toast.error("Failed to upload image: " + error.message);
    } finally {
      setUploadingImage(false);
      if (imageUploadRef.current) {
        imageUploadRef.current.value = "";
      }
    }
  };

  // In BlogManagement.tsx - Updated savePost function

  const savePost = async () => {
    try {
      if (!editingPost.title) {
        toast.error("Title is required");
        return;
      }
      if (!editingPost.content) {
        toast.error("Content is required");
        return;
      }

      const slug = editingPost.slug || generateSlug(editingPost.title);

      const wordCount =
        editingPost.content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0;
      const readingTime = Math.max(1, Math.ceil(wordCount / 200));

      const postData = {
        title: editingPost.title,
        slug,
        content: editingPost.content,
        excerpt:
          editingPost.excerpt ||
          editingPost.content?.replace(/<[^>]*>/g, "").substring(0, 160),
        featured_image: editingPost.featured_image || "",
        status: editingPost.status || "draft",
        tags: editingPost.tags || [],
        is_featured: editingPost.is_featured || false,
        reading_time: readingTime,
        author_name: editingPost.author_name || "Admin",
        published_at:
          editingPost.status === "published" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      };

      let postId: string;

      if (editingPost.id) {
        // Update existing post
        const { data, error } = await supabase
          .from("blog_posts")
          .update(postData)
          .eq("id", editingPost.id)
          .select()
          .single();

        if (error) throw error;
        postId = data.id;
        toast.success("Post updated successfully");
      } else {
        // Create new post
        const { data, error } = await supabase
          .from("blog_posts")
          .insert({
            ...postData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        postId = data.id;
        toast.success("Post created successfully");
      }

      // ✅ Handle categories separately with better error handling
      if (selectedCategories.length > 0) {
        // First, delete existing categories
        const { error: deleteError } = await supabase
          .from("blog_post_categories")
          .delete()
          .eq("post_id", postId);

        if (deleteError) {
          console.error("Error deleting categories:", deleteError);
          // Continue anyway - try to insert new categories
        }

        // Insert new categories
        const categoryData = selectedCategories.map((categoryId) => ({
          post_id: postId,
          category_id: categoryId,
        }));

        const { error: insertError } = await supabase
          .from("blog_post_categories")
          .insert(categoryData);

        if (insertError) {
          console.error("Error inserting categories:", insertError);
          toast.warning("Post saved but categories could not be updated");
        } else {
          toast.success("Categories updated successfully");
        }
      } else {
        // If no categories selected, remove all
        await supabase
          .from("blog_post_categories")
          .delete()
          .eq("post_id", postId);
      }

      setShowDialog(false);
      setEditingPost({});
      setSelectedCategories([]);
      fetchPosts();
    } catch (error: any) {
      console.error("Save post error:", error);
      toast.error("Failed to save post: " + error.message);
    }
  };
  const deletePost = async () => {
    if (!postToDelete) return;
    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", postToDelete);

      if (error) throw error;
      toast.success("Post deleted");
      fetchPosts();
      setShowDeleteDialog(false);
      setPostToDelete(null);
    } catch (error: any) {
      toast.error("Failed to delete post: " + error.message);
    }
  };

  const filteredPosts = posts.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.author_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || p.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPosts.length / itemsPerPage);
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getStatusBadge = (status: string) => {
    const config: Record<string, { color: string; icon: any }> = {
      draft: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      published: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      archived: { color: "bg-gray-100 text-gray-800", icon: XCircle },
    };
    return config[status] || config.draft;
  };

  const toolbarItems: ToolbarGroup[] = [
    {
      group: "history",
      items: [
        {
          icon: Undo,
          action: () => editor?.chain().focus().undo().run(),
          title: "Undo",
        },
        {
          icon: Redo,
          action: () => editor?.chain().focus().redo().run(),
          title: "Redo",
        },
      ],
    },
    {
      group: "formatting",
      items: [
        {
          icon: Bold,
          action: () => editor?.chain().focus().toggleBold().run(),
          isActive: editor?.isActive("bold"),
          title: "Bold",
        },
        {
          icon: Italic,
          action: () => editor?.chain().focus().toggleItalic().run(),
          isActive: editor?.isActive("italic"),
          title: "Italic",
        },
        {
          icon: UnderlineIcon,
          action: () => editor?.chain().focus().toggleUnderline().run(),
          isActive: editor?.isActive("underline"),
          title: "Underline",
        },
        {
          icon: Strikethrough,
          action: () => editor?.chain().focus().toggleStrike().run(),
          isActive: editor?.isActive("strike"),
          title: "Strikethrough",
        },
      ],
    },
    {
      group: "headings",
      items: [
        {
          icon: Heading1,
          action: () =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run(),
          isActive: editor?.isActive("heading", { level: 1 }),
          title: "Heading 1",
        },
        {
          icon: Heading2,
          action: () =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          isActive: editor?.isActive("heading", { level: 2 }),
          title: "Heading 2",
        },
        {
          icon: Heading3,
          action: () =>
            editor?.chain().focus().toggleHeading({ level: 3 }).run(),
          isActive: editor?.isActive("heading", { level: 3 }),
          title: "Heading 3",
        },
      ],
    },
    {
      group: "lists",
      items: [
        {
          icon: List,
          action: () => editor?.chain().focus().toggleBulletList().run(),
          isActive: editor?.isActive("bulletList"),
          title: "Bullet List",
        },
        {
          icon: ListOrdered,
          action: () => editor?.chain().focus().toggleOrderedList().run(),
          isActive: editor?.isActive("orderedList"),
          title: "Numbered List",
        },
      ],
    },
    {
      group: "alignment",
      items: [
        {
          icon: AlignLeft,
          action: () => editor?.chain().focus().setTextAlign("left").run(),
          isActive: editor?.isActive({ textAlign: "left" }),
          title: "Align Left",
        },
        {
          icon: AlignCenter,
          action: () => editor?.chain().focus().setTextAlign("center").run(),
          isActive: editor?.isActive({ textAlign: "center" }),
          title: "Align Center",
        },
        {
          icon: AlignRight,
          action: () => editor?.chain().focus().setTextAlign("right").run(),
          isActive: editor?.isActive({ textAlign: "right" }),
          title: "Align Right",
        },
        {
          icon: AlignJustify,
          action: () => editor?.chain().focus().setTextAlign("justify").run(),
          isActive: editor?.isActive({ textAlign: "justify" }),
          title: "Justify",
        },
      ],
    },
    {
      group: "insert",
      items: [
        {
          icon: ImageIcon2,
          action: () => imageUploadRef.current?.click(),
          title: "Insert Image",
        },
        {
          icon: LinkIcon,
          action: () => {
            const url = window.prompt("Enter URL:");
            if (url) {
              editor?.chain().focus().setLink({ href: url }).run();
            }
          },
          isActive: editor?.isActive("link"),
          title: "Insert Link",
        },
        {
          icon: Quote,
          action: () => editor?.chain().focus().toggleBlockquote().run(),
          isActive: editor?.isActive("blockquote"),
          title: "Block Quote",
        },
        {
          icon: Code,
          action: () => editor?.chain().focus().toggleCodeBlock().run(),
          isActive: editor?.isActive("codeBlock"),
          title: "Code Block",
        },
        {
          icon: TableIcon,
          action: () => {
            editor
              ?.chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run();
          },
          title: "Insert Table",
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-pink-600" />
            Blog Management
          </h2>
          <p className="text-gray-500">Create and manage blog posts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={fetchPosts}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-pink-600 hover:bg-pink-700 text-white"
            onClick={() => {
              setEditingPost({ status: "draft" });
              setSelectedCategories([]);
              setShowDialog(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Posts",
            value: posts.length,
            icon: FileText,
            color: "text-blue-600",
          },
          {
            label: "Published",
            value: posts.filter((p) => p.status === "published").length,
            icon: CheckCircle,
            color: "text-green-600",
          },
          {
            label: "Drafts",
            value: posts.filter((p) => p.status === "draft").length,
            icon: Clock,
            color: "text-yellow-600",
          },
          {
            label: "Total Views",
            value: posts.reduce((sum, p) => sum + (p.views || 0), 0),
            icon: Eye,
            color: "text-purple-600",
          },
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Posts List - same as before */}
      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : paginatedPosts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No blog posts found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setEditingPost({ status: "draft" });
                setSelectedCategories([]);
                setShowDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create your first post
            </Button>
          </div>
        ) : (
          paginatedPosts.map((post) => {
            const statusBadge = getStatusBadge(post.status);
            const StatusIcon = statusBadge.icon;
            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card
                  className={`hover:shadow-md transition-shadow ${post.is_featured ? "border-l-4 border-l-pink-600" : ""}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={statusBadge.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {post.status}
                          </Badge>
                          {post.is_featured && (
                            <Badge className="bg-pink-100 text-pink-800">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex items-center gap-1">
                              {post.tags.slice(0, 2).map((tag, i) => (
                                <Badge
                                  key={i}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                              {post.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{post.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                          <span className="text-xs text-gray-500">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                          {post.views > 0 && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {post.views}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium mt-1">{post.title}</h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {post.excerpt ||
                            post.content
                              ?.replace(/<[^>]*>/g, "")
                              .substring(0, 160)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author_name || "Admin"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.reading_time || 0} min read
                          </span>
                          {post.categories && post.categories.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {post.categories.map((c) => c.name).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPost({
                              ...post,
                              categories: post.categories || [],
                            });
                            setSelectedCategories(
                              post.categories?.map((c) => c.id) || [],
                            );
                            setShowDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            window.open(`/blog/${post.slug}`, "_blank");
                          }}
                          className="text-blue-600"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setPostToDelete(post.id);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, filteredPosts.length)} of{" "}
            {filteredPosts.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-[90vw] w-[90vw] sm:max-w-[90vw] sm:w-[90vw] md:max-w-[85vw] md:w-[85vw] lg:max-w-[1400px] lg:w-[95%] max-h-[90vh] overflow-y-auto p-6">
          <DialogHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4 border-b border-gray-200 dark:border-gray-800">
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6 text-pink-600" />
              {editingPost.id ? "Edit Blog Post" : "Create Blog Post"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Title & Status - 3 columns for better spacing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label className="text-sm font-medium">Title *</Label>
                <Input
                  value={editingPost.title || ""}
                  onChange={(e) => {
                    const title = e.target.value;
                    setEditingPost({
                      ...editingPost,
                      title,
                      slug: editingPost.slug || generateSlug(title),
                    });
                  }}
                  placeholder="Enter post title"
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Select
                  value={editingPost.status || "draft"}
                  onValueChange={(value: any) =>
                    setEditingPost({ ...editingPost, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">📝 Draft</SelectItem>
                    <SelectItem value="published">🚀 Published</SelectItem>
                    <SelectItem value="archived">📦 Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Slug & Featured Image */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Slug</Label>
                <Input
                  value={editingPost.slug || ""}
                  onChange={(e) =>
                    setEditingPost({ ...editingPost, slug: e.target.value })
                  }
                  placeholder="auto-generated from title"
                />
                <p className="text-xs text-gray-500">
                  URL-friendly version of the title
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Featured Image URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={editingPost.featured_image || ""}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        featured_image: e.target.value,
                      })
                    }
                    placeholder="https://example.com/image.jpg"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const url = window.prompt("Enter image URL:");
                      if (url) {
                        setEditingPost({ ...editingPost, featured_image: url });
                      }
                    }}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
                {editingPost.featured_image && (
                  <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 mt-2">
                    <img
                      src={editingPost.featured_image}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Tags & Categories */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Tags (comma separated)
                </Label>
                <Input
                  value={editingPost.tags?.join(", ") || ""}
                  onChange={(e) =>
                    setEditingPost({
                      ...editingPost,
                      tags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="wine, spirits, premium"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Categories</Label>
                <Select
                  value={
                    selectedCategories.length > 0 ? selectedCategories[0] : ""
                  }
                  onValueChange={(value) => {
                    if (value && !selectedCategories.includes(value)) {
                      setSelectedCategories([...selectedCategories, value]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Add categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCategories.map((id) => {
                    const cat = categories.find((c) => c.id === id);
                    return cat ? (
                      <Badge
                        key={id}
                        className="bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400"
                      >
                        {cat.name}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCategories(
                              selectedCategories.filter((c) => c !== id),
                            )
                          }
                          className="ml-1 hover:text-pink-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            {/* Featured & Author */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Switch
                  checked={editingPost.is_featured || false}
                  onCheckedChange={(checked) =>
                    setEditingPost({ ...editingPost, is_featured: checked })
                  }
                />
                <Label className="text-sm font-medium">⭐ Featured Post</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Author Name</Label>
                <Input
                  value={editingPost.author_name || ""}
                  onChange={(e) =>
                    setEditingPost({
                      ...editingPost,
                      author_name: e.target.value,
                    })
                  }
                  placeholder="Author name"
                />
              </div>
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Excerpt</Label>
              <Textarea
                value={editingPost.excerpt || ""}
                onChange={(e) =>
                  setEditingPost({ ...editingPost, excerpt: e.target.value })
                }
                placeholder="Brief summary of the post (max 160 characters)"
                rows={2}
                maxLength={160}
              />
              <p className="text-xs text-gray-500">
                {editingPost.excerpt?.length || 0}/160 characters
              </p>
            </div>

            {/* Rich Text Editor - Full Width */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Content *</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <EyeOff className="h-4 w-4 mr-1" />
                    ) : (
                      <Eye className="h-4 w-4 mr-1" />
                    )}
                    {showPreview ? "Hide Preview" : "Preview"}
                  </Button>
                  <input
                    ref={imageUploadRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Toolbar */}
                <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2 flex flex-wrap gap-1">
                  {toolbarItems.map((group, groupIndex) => (
                    <div key={groupIndex} className="flex items-center gap-1">
                      {group.items.map((item, itemIndex) => (
                        <ToolbarButton
                          key={itemIndex}
                          onClick={item.action}
                          isActive={item.isActive}
                          title={item.title}
                        >
                          <item.icon className="h-4 w-4" />
                        </ToolbarButton>
                      ))}
                      {groupIndex < toolbarItems.length - 1 && (
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                      )}
                    </div>
                  ))}
                </div>

                {/* Editor / Preview */}
                {showPreview ? (
                  <div className="p-6 prose prose-sm sm:prose-base lg:prose-lg max-w-none min-h-[400px] bg-white dark:bg-gray-900">
                    {editingPost.content ? (
                      <div
                        dangerouslySetInnerHTML={{
                          __html: editingPost.content,
                        }}
                      />
                    ) : (
                      <p className="text-gray-400 text-center">
                        No content to preview
                      </p>
                    )}
                  </div>
                ) : (
                  <EditorContent
                    editor={editor}
                    className="min-h-[400px] bg-white dark:bg-gray-900"
                  />
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-800 sticky bottom-0 bg-white dark:bg-gray-900 py-4 -mx-6 px-6">
              <Button
                className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white"
                onClick={savePost}
              >
                <Save className="h-4 w-4 mr-2" />
                {editingPost.id ? "Update Post" : "Publish Post"}
              </Button>
              {editingPost.id && (
                <Button
                  variant="outline"
                  onClick={() => {
                    window.open(`/blog/${editingPost.slug}`, "_blank");
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  setShowDialog(false);
                  setEditingPost({});
                  setSelectedCategories([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The post will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deletePost}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
