"use client";

import { useMemo, useState } from "react";
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

export function ResourceBrowser({ resources, initialQuery = "" }: { resources: ResourceRow[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [branch, setBranch] = useState("All Branches");
  const [semester, setSemester] = useState("All Semesters");
  const [type, setType] = useState("All Types");
  const [sort, setSort] = useState("Most Relevant");

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
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 focus:border-blue-500 focus:ring-4 md:col-span-2 xl:col-span-1"
          placeholder="Search title, subject, tags, summary..."
        />

        <select value={branch} onChange={(event) => setBranch(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 focus:border-blue-500 focus:ring-4">
          {branches.map((item) => <option key={item}>{item}</option>)}
        </select>

        <select value={semester} onChange={(event) => setSemester(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 focus:border-blue-500 focus:ring-4">
          {semesters.map((item) => <option key={item}>{item}</option>)}
        </select>

        <select value={type} onChange={(event) => setType(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 focus:border-blue-500 focus:ring-4">
          {resourceTypes.map((item) => <option key={item}>{item}</option>)}
        </select>

        <select value={sort} onChange={(event) => setSort(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none ring-blue-100 focus:border-blue-500 focus:ring-4">
          {sortOptions.map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
        <p>
          Showing <b className="text-slate-900">{filteredResources.length}</b> of <b className="text-slate-900">{resources.length}</b> approved resources
        </p>
        {(query || branch !== "All Branches" || semester !== "All Semesters" || type !== "All Types" || sort !== "Most Relevant") && (
          <button onClick={clearFilters} className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
            Clear filters
          </button>
        )}
      </div>

      {filteredResources.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-soft">
          <h3 className="text-xl font-black text-slate-950">No resources found</h3>
          <p className="mt-2 text-sm text-slate-500">Try a different keyword, branch, semester, or resource type.</p>
        </div>
      )}
    </div>
  );
}
