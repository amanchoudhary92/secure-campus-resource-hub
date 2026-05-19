"use client";

import { useMemo, useState } from "react";
import { Filter, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import type { ResourceRow } from "@/lib/db/supabase-admin";
import { ResourceCard } from "@/components/resources/ResourceCard";

const branches = ["All Branches", "CSE", "IT", "ECE", "ME", "CE"];
const semesters = ["All Semesters", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const resourceTypes = ["All Types", "Notes", "PYQ", "Lab File", "Assignment", "Syllabus"];
const sortOptions = ["Most Relevant", "Latest", "Title A-Z"];

function normalize(value: unknown) {
  return String(value || "").toLowerCase().trim();
}

function searchableText(resource: ResourceRow) {
  return normalize([
    resource.title,
    resource.description,
    resource.summary,
    resource.subject,
    resource.branch,
    resource.semester,
    resource.resource_type,
    resource.file_name,
    resource.uploaded_by_name,
    ...(resource.tags || []),
    ...(resource.keywords || []),
  ].join(" "));
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none ring-blue-100 transition focus:border-blue-500 focus:ring-4"
      >
        {options.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </label>
  );
}

export function ResourceBrowser({
  resources,
  initialQuery = "",
}: {
  resources: ResourceRow[];
  initialQuery?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [branch, setBranch] = useState("All Branches");
  const [semester, setSemester] = useState("All Semesters");
  const [type, setType] = useState("All Types");
  const [sort, setSort] = useState("Most Relevant");

  const activeFilterCount = [
    query,
    branch !== "All Branches" ? branch : "",
    semester !== "All Semesters" ? semester : "",
    type !== "All Types" ? type : "",
    sort !== "Most Relevant" ? sort : "",
  ].filter(Boolean).length;

  const filteredResources = useMemo(() => {
    const q = normalize(query);

    const filtered = resources.filter((resource) => {
      const matchesQuery = !q || searchableText(resource).includes(q);
      const matchesBranch = branch === "All Branches" || resource.branch === branch;
      const matchesSemester = semester === "All Semesters" || resource.semester === semester;
      const matchesType = type === "All Types" || resource.resource_type === type;

      return matchesQuery && matchesBranch && matchesSemester && matchesType;
    });

    return [...filtered].sort((a, b) => {
      if (sort === "Latest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      if (sort === "Title A-Z") {
        return a.title.localeCompare(b.title);
      }

      if (!q) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      const aTitle = normalize(a.title).includes(q) ? 0 : 1;
      const bTitle = normalize(b.title).includes(q) ? 0 : 1;
      return aTitle - bTitle;
    });
  }, [resources, query, branch, semester, type, sort]);

  function clearFilters() {
    setQuery("");
    setBranch("All Branches");
    setSemester("All Semesters");
    setType("All Types");
    setSort("Most Relevant");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-soft md:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-700">
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Smart filters
            </div>
            <h2 className="mt-3 text-xl font-black text-slate-950">
              Find the right resource faster
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Search by title, subject, tags, summary, semester, branch, or file name.
            </p>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 transition hover:bg-slate-200"
            >
              <RotateCcw className="h-4 w-4" />
              Clear filters
            </button>
          )}
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none ring-blue-100 transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4"
                placeholder="Search notes, PYQs, DBMS, CN..."
              />
            </div>
          </label>

          <SelectFilter label="Branch" value={branch} options={branches} onChange={setBranch} />
          <SelectFilter label="Semester" value={semester} options={semesters} onChange={setSemester} />
          <SelectFilter label="Type" value={type} options={resourceTypes} onChange={setType} />
          <SelectFilter label="Sort" value={sort} options={sortOptions} onChange={setSort} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-500 shadow-soft">
        <p>
          Showing{" "}
          <b className="text-slate-950">{filteredResources.length}</b> of{" "}
          <b className="text-slate-950">{resources.length}</b> approved resources
        </p>

        <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
          <Filter className="h-4 w-4 text-blue-600" />
          {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
        </div>
      </div>

      {filteredResources.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl font-black text-slate-950">No resources found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Try a different keyword, branch, semester, or resource type. You can also request missing material from the Requests page.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <button
              onClick={clearFilters}
              className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200"
            >
              Reset filters
            </button>
            <a
              href="/requests"
              className="rounded-2xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"
            >
              Request resource
            </a>
          </div>
        </div>
      )}
    </div>
  );
}