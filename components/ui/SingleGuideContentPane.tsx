'use client'

import React from 'react'
import Image from 'next/image'
import { BookOpen, Clock, Eye, Wrench, Package, Lightbulb } from 'lucide-react'

const DIFF_STYLE: Record<string, string> = {
  beginner:     'text-green-400 bg-green-400/10 border-green-400/20',
  intermediate: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  advanced:     'text-red-400 bg-red-400/10 border-red-400/20',
}

export interface Step {
  id: string
  step_number: number
  title: string
  body: string | null
  tip: string | null
  image_url: string | null
}

export interface ToolItem {
  id: string
  name: string
  quantity: number
}

export interface PartItem {
  id: string
  name: string
  quantity: number
  products?: {
    id: string
    name: string
    slug: string
  } | null
}

export interface Guide {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  category: string | null
  difficulty: string | null
  estimated_minutes: number | null
  views: number
}

interface Props {
  guide: Guide
  steps: Step[]
  tools: ToolItem[]
  parts: PartItem[]
}

export function SingleGuideContentPane({ guide, steps, tools, parts }: Props) {
  return (
    <div className="space-y-6">
      {/* Cover image */}
      {guide.cover_image_url && (
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden bg-surface-variant border border-border/40">
          <Image
            src={guide.cover_image_url}
            alt={guide.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3 border-b border-border/40 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {guide.category && (
            <span className="text-xs font-semibold text-primary uppercase tracking-wide">
              {guide.category}
            </span>
          )}
          {guide.difficulty && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase font-bold border ${DIFF_STYLE[guide.difficulty]}`}>
              {guide.difficulty}
            </span>
          )}
          {guide.estimated_minutes && (
            <span className="inline-flex items-center gap-1 text-xs text-text-secondary font-medium">
              <Clock className="h-3.5 w-3.5 text-primary" /> {guide.estimated_minutes} min read
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-xs text-text-muted">
            <Eye className="h-3.5 w-3.5" /> {guide.views ?? 0} views
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide" style={{ fontFamily: 'var(--font-orbitron)' }}>
          {guide.title}
        </h1>
        {guide.description && (
          <p className="text-text-secondary text-sm leading-relaxed">{guide.description}</p>
        )}
      </div>

      {/* Tools & Parts sidebar-ish section */}
      {((tools ?? []).length > 0 || (parts ?? []).length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Tools */}
          {(tools ?? []).length > 0 && (
            <div className="bg-surface/50 border border-border rounded-xl p-4">
              <h2 className="font-bold text-xs flex items-center gap-2 mb-3 text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
                <Wrench className="h-4 w-4 text-primary" /> Tools Needed
              </h2>
              <ul className="space-y-1.5">
                {(tools ?? []).map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{t.name}</span>
                    <span className="text-primary font-bold">×{t.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Parts */}
          {(parts ?? []).length > 0 && (
            <div className="bg-surface/50 border border-border rounded-xl p-4">
              <h2 className="font-bold text-xs flex items-center gap-2 mb-3 text-white uppercase tracking-wider" style={{ fontFamily: 'var(--font-orbitron)' }}>
                <Package className="h-4 w-4 text-primary" /> Parts Needed
              </h2>
              <ul className="space-y-1.5">
                {(parts ?? []).map((p: any) => (
                  <li key={p.id} className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{p.name}</span>
                    <span className="text-primary font-bold">×{p.quantity}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2" style={{ fontFamily: 'var(--font-orbitron)' }}>
          <BookOpen className="h-4 w-4 text-primary" />
          Instructions Steps
          <span className="text-xs font-normal text-text-muted">({(steps ?? []).length})</span>
        </h2>

        <div className="space-y-4">
          {(steps ?? []).map((step) => (
            <div
              key={step.id}
              className="bg-surface/30 border border-border/80 rounded-xl overflow-hidden p-4 space-y-3"
            >
              {/* Step header */}
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-extrabold flex items-center justify-center shrink-0">
                  {step.step_number}
                </span>
                <h3 className="font-bold text-white text-sm">{step.title}</h3>
              </div>

              {/* Step image */}
              {step.image_url && (
                <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden bg-surface-variant max-w-lg">
                  <Image
                    src={step.image_url}
                    alt={step.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              {/* Body */}
              {step.body && (
                <p className="text-text-secondary text-xs leading-relaxed pl-9">
                  {step.body}
                </p>
              )}

              {/* Tip */}
              {step.tip && (
                <div className="ml-9 flex gap-2 bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2.5 text-xs">
                  <Lightbulb className="h-3.5 w-3.5 text-yellow-400 shrink-0 mt-0.5" />
                  <p className="text-yellow-100/90">{step.tip}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
