import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import VideoLayout from "@/components/VideoLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Play,
  CheckCircle2,
  Radio,
  Loader2,
  TrendingUp,
  Clock,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";

function formatDuration(seconds: number): string {
  if (!seconds) return "LIVE";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M visualizações`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K visualizações`;
  return `${views} visualizações`;
}

interface YouTubeVideo {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  channelAvatar: string;
  channelVerified: boolean;
  thumbnailUrl: string;
  duration: number;
  publishedTimeText: string;
  views: number;
  description: string;
  isLive: boolean;
}

function VideoCard({ video }: { video: YouTubeVideo }) {
  return (
    <Link href={`/youtube/${video.videoId}`}>
      <Card className="flex gap-4 p-0 overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer border-0 shadow-none">
        <div className="relative w-[360px] min-w-[360px] aspect-video rounded-xl overflow-hidden bg-muted flex-shrink-0">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {video.isLive ? (
            <Badge className="absolute bottom-2 right-2 bg-red-600 text-white text-xs">
              <Radio className="w-3 h-3 mr-1" />
              AO VIVO
            </Badge>
          ) : video.duration > 0 ? (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              {formatDuration(video.duration)}
            </span>
          ) : null}
        </div>
        <div className="flex-1 py-2 pr-4 space-y-2">
          <h3 className="font-semibold text-base leading-snug line-clamp-2 text-foreground">
            {video.title}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{formatViews(video.views)}</span>
            {video.publishedTimeText && (
              <>
                <span>•</span>
                <span>{video.publishedTimeText}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {video.channelAvatar && (
              <img
                src={video.channelAvatar}
                alt={video.channelName}
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="text-sm text-muted-foreground">{video.channelName}</span>
            {video.channelVerified && (
              <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </div>
          {video.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
              {video.description}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
}

function VideoCardCompact({ video }: { video: YouTubeVideo }) {
  return (
    <Link href={`/youtube/${video.videoId}`}>
      <div className="group cursor-pointer">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mb-2">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            loading="lazy"
          />
          {video.isLive ? (
            <Badge className="absolute bottom-2 right-2 bg-red-600 text-white text-xs">
              <Radio className="w-3 h-3 mr-1" />
              AO VIVO
            </Badge>
          ) : video.duration > 0 ? (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
              {formatDuration(video.duration)}
            </span>
          ) : null}
        </div>
        <div className="flex gap-2">
          {video.channelAvatar && (
            <img
              src={video.channelAvatar}
              alt={video.channelName}
              className="w-9 h-9 rounded-full mt-0.5 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm leading-snug line-clamp-2 text-foreground">
              {video.title}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">{video.channelName}</span>
              {video.channelVerified && (
                <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>{formatViews(video.views)}</span>
              {video.publishedTimeText && (
                <>
                  <span>•</span>
                  <span>{video.publishedTimeText}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function VideoCardSkeleton() {
  return (
    <div className="flex gap-4">
      <Skeleton className="w-[360px] min-w-[360px] aspect-video rounded-xl" />
      <div className="flex-1 space-y-3 py-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
      </div>
    </div>
  );
}

export { VideoCardCompact, formatDuration, formatViews };
export type { YouTubeVideo };

// Autocomplete dropdown component
function AutocompleteDropdown({
  suggestions,
  recentSearches,
  isVisible,
  highlightIndex,
  onSelect,
  onRemoveRecent,
  inputValue,
}: {
  suggestions: string[];
  recentSearches: string[];
  isVisible: boolean;
  highlightIndex: number;
  onSelect: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  inputValue: string;
}) {
  if (!isVisible) return null;

  const hasContent = suggestions.length > 0 || (recentSearches.length > 0 && !inputValue);

  if (!hasContent) return null;

  // Highlight matching part of suggestion
  const highlightMatch = (text: string, query: string) => {
    if (!query) return <span>{text}</span>;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const idx = lowerText.indexOf(lowerQuery);
    if (idx === -1) return <span>{text}</span>;
    return (
      <span>
        {text.slice(0, idx)}
        <span className="font-bold text-foreground">{text.slice(idx, idx + query.length)}</span>
        {text.slice(idx + query.length)}
      </span>
    );
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-xl z-50 overflow-hidden max-h-[400px] overflow-y-auto">
      {/* Recent searches when input is empty */}
      {!inputValue && recentSearches.length > 0 && (
        <div className="py-1">
          <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pesquisas recentes
          </div>
          {recentSearches.map((term, i) => (
            <div
              key={`recent-${term}`}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                highlightIndex === i ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              }`}
              onClick={() => onSelect(term)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-sm">{term}</span>
              <button
                className="p-1 rounded-full hover:bg-muted transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveRecent(term);
                }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Autocomplete suggestions */}
      {inputValue && suggestions.length > 0 && (
        <div className="py-1">
          {suggestions.map((suggestion, i) => (
            <div
              key={`suggestion-${suggestion}`}
              className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors ${
                highlightIndex === i ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"
              }`}
              onClick={() => onSelect(suggestion)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="flex-1 text-sm text-foreground">
                {highlightMatch(suggestion, inputValue)}
              </span>
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const RECENT_SEARCHES_KEY = "smarttube_recent_searches";
const MAX_RECENT_SEARCHES = 10;

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string) {
  try {
    const recent = getRecentSearches().filter((s) => s !== term);
    recent.unshift(term);
    localStorage.setItem(
      RECENT_SEARCHES_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT_SEARCHES))
    );
  } catch {
    // ignore
  }
}

function removeRecentSearch(term: string) {
  try {
    const recent = getRecentSearches().filter((s) => s !== term);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
  } catch {
    // ignore
  }
}

export default function YouTubeSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [, navigate] = useLocation();

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Debounce the autocomplete query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (searchQuery.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        setDebouncedQuery(searchQuery.trim());
      }, 200);
    } else {
      setDebouncedQuery("");
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Fetch autocomplete suggestions
  const { data: autocompleteData } = trpc.youtube.autocomplete.useQuery(
    { query: debouncedQuery },
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 60000,
      refetchOnWindowFocus: false,
    }
  );

  const suggestions = autocompleteData?.suggestions || [];

  const stableQuery = useMemo(() => activeQuery, [activeQuery]);

  const { data, isLoading, isFetching } = trpc.youtube.search.useQuery(
    { query: stableQuery },
    { enabled: stableQuery.length > 0 }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      setSearchQuery(trimmed);
      setActiveQuery(trimmed);
      setCursor(undefined);
      setShowDropdown(false);
      setHighlightIndex(-1);
      saveRecentSearch(trimmed);
      setRecentSearches(getRecentSearches());
      inputRef.current?.blur();
    },
    []
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setHighlightIndex(-1);
    if (!showDropdown) setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const currentItems = searchQuery.trim()
    ? suggestions
    : recentSearches;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || currentItems.length === 0) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setShowDropdown(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev < currentItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) =>
          prev > 0 ? prev - 1 : currentItems.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < currentItems.length) {
          performSearch(currentItems[highlightIndex]);
        } else {
          performSearch(searchQuery);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        setHighlightIndex(-1);
        break;
      case "Tab":
        if (highlightIndex >= 0 && highlightIndex < currentItems.length) {
          e.preventDefault();
          setSearchQuery(currentItems[highlightIndex]);
        }
        break;
    }
  };

  const handleRemoveRecent = (term: string) => {
    removeRecentSearch(term);
    setRecentSearches(getRecentSearches());
  };

  return (
    <VideoLayout>
      <div className="h-full overflow-y-auto">
        <div className="container py-6 space-y-6 max-w-5xl">
          {/* Search Bar with Autocomplete */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground z-10" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onKeyDown={handleKeyDown}
                placeholder="Buscar vídeos no YouTube..."
                className="pl-10 h-12 text-base"
                autoComplete="off"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors z-10"
                  onClick={() => {
                    setSearchQuery("");
                    setDebouncedQuery("");
                    inputRef.current?.focus();
                  }}
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
              <AutocompleteDropdown
                suggestions={suggestions}
                recentSearches={recentSearches}
                isVisible={showDropdown}
                highlightIndex={highlightIndex}
                onSelect={performSearch}
                onRemoveRecent={handleRemoveRecent}
                inputValue={searchQuery.trim()}
              />
            </div>
            <Button type="submit" size="lg" disabled={!searchQuery.trim()}>
              <Search className="w-5 h-5 mr-2" />
              Buscar
            </Button>
          </form>

          {/* Suggestions / Refinements */}
          {data?.refinements && data.refinements.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {data.refinements.slice(0, 8).map((ref, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => performSearch(ref)}
                >
                  {ref}
                </Button>
              ))}
            </div>
          )}

          {/* Results */}
          {isLoading && (
            <div className="space-y-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          )}

          {data && data.videos.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground mb-4">
                Aproximadamente {data.estimatedResults?.toLocaleString()} resultados
              </p>
              <div className="space-y-4">
                {data.videos.map(
                  (video) =>
                    video && <VideoCard key={video.videoId} video={video} />
                )}
              </div>
            </div>
          )}

          {data && data.videos.length === 0 && activeQuery && !isLoading && (
            <div className="text-center py-16 space-y-4">
              <Search className="w-16 h-16 mx-auto text-muted-foreground" />
              <h2 className="text-xl font-semibold">Nenhum resultado encontrado</h2>
              <p className="text-muted-foreground">
                Tente buscar por outros termos
              </p>
            </div>
          )}

          {!activeQuery && !isLoading && (
            <div className="text-center py-16 space-y-4">
              <Play className="w-20 h-20 mx-auto text-muted-foreground/50" />
              <h2 className="text-2xl font-semibold text-foreground">
                Buscar no YouTube
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Digite o que deseja assistir e encontre milhões de vídeos
                diretamente aqui
              </p>
            </div>
          )}

          {/* Load More */}
          {data?.cursorNext && (
            <div className="text-center py-4">
              <Button
                variant="outline"
                disabled={isFetching}
                onClick={() => setCursor(data.cursorNext || undefined)}
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Carregar mais resultados
              </Button>
            </div>
          )}
        </div>
      </div>
    </VideoLayout>
  );
}
