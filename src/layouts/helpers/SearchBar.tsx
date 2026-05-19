import { plainify } from "@/lib/utils/textConverter";
import Fuse from "fuse.js";
import React, { useEffect, useMemo, useRef, useState } from "react";
export type SearchItem = {
  slug: string;
  title: string;
  description: string;
  categories: string[];
  categorySlugs: Array<string | null>;
  tags: string[];
  content: string;
};

interface Props {
  searchList: SearchItem[];
}

interface SearchResult {
  item: SearchItem;
  refIndex: number;
}

const normalizeSearchText = (value: unknown) =>
  String(value ?? "").toLowerCase();

const exactSearchFields = (item: SearchItem) => [
  item.title,
  item.description,
  ...item.categories,
  ...item.tags,
];

export default function SearchBar({ searchList }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputVal, setInputVal] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(
    null,
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.currentTarget.value);
  };

  const fuse = useMemo(
    () =>
      new Fuse(searchList, {
        keys: ["title", "description", "content", "categories", "tags"],
        includeMatches: true,
        minMatchCharLength: 2,
        threshold: 0.35,
      }),
    [searchList],
  );

  useEffect(() => {
    const searchUrl = new URLSearchParams(window.location.search);
    const searchStr = searchUrl.get("q");
    if (searchStr) setInputVal(searchStr);

    setTimeout(function () {
      inputRef.current!.selectionStart = inputRef.current!.selectionEnd =
        searchStr?.length || 0;
    }, 50);
  }, []);

  useEffect(() => {
    const keyword = inputVal.trim();
    const normalizedKeyword = normalizeSearchText(keyword);
    const inputResult =
      keyword.length > 3
        ? fuse.search(keyword)
        : keyword.length > 1
          ? searchList
              .filter((item) =>
                exactSearchFields(item).some((field) =>
                  normalizeSearchText(field).includes(normalizedKeyword),
                ),
              )
              .map((item, refIndex) => ({ item, refIndex }))
          : [];
    setSearchResults(inputResult);

    if (inputVal.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      searchParams.set("q", inputVal);
      const newRelativePathQuery =
        window.location.pathname + "?" + searchParams.toString();
      history.pushState(null, "", newRelativePathQuery);
    } else {
      history.pushState(null, "", window.location.pathname);
    }
  }, [inputVal, fuse, searchList]);

  return (
    <div className="min-h-[45vh]">
      <div className="mx-auto max-w-3xl">
        <h1 className="h2 mb-6 text-center">搜尋文章</h1>
        <input
          className="form-input min-h-12 w-full"
          placeholder="搜尋標題、摘要、內文、分類或標籤"
          type="search"
          name="search"
          value={inputVal}
          onChange={handleChange}
          autoComplete="off"
          autoFocus
          ref={inputRef}
        />
      </div>

      <div className="row">
        <div className="mx-auto px-0 lg:col-8">
          {inputVal.length > 1 && (
            <h2 className="mt-8 mb-4 font-normal">
              找到 {searchResults?.length ?? 0} 篇與{" "}
              <span className="text-primary">{inputVal}</span> 相關的文章
            </h2>
          )}
          {searchResults?.length ? (
            <div className="rounded py-12 px-9 shadow md:p-[60px]">
              {searchResults?.map(({ item }) => (
                <div
                  className="card mb-12 border-b border-border pb-[30px]"
                  key={item.slug}
                >
                  <h3 className="h4">
                    <a
                      href={`/posts/${item.slug}`}
                      className="block font-normal text-primary hover:underline"
                    >
                      {item.title}
                    </a>
                  </h3>
                  <p className="mt-2.5 text-lg text-text line-clamp-2">
                    {item.description || plainify(item.content)}
                  </p>
                  <p className="mt-3 flex flex-wrap gap-2 text-lg">
                    {item.categories?.map((category, index) => {
                      const categorySlug = item.categorySlugs[index];

                      return categorySlug ? (
                        <a
                          key={category}
                          href={`/categories/${categorySlug}`}
                          className="rounded-md bg-light px-3 py-1 text-sm text-text-dark hover:bg-primary hover:text-white"
                        >
                          {category}
                        </a>
                      ) : null;
                    })}
                  </p>
                </div>
              ))}
            </div>
          ) : inputVal.length > 1 ? (
            <p className="rounded px-6 py-8 text-center shadow">
              目前沒有找到符合「{inputVal}」的文章。
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
