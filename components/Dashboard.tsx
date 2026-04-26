'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase-client'

interface Props {
  userId: string
  initialHabits: Record<string, unknown>[]
  initialTodos: Record<string, unknown>[]
  initialLogs: Record<string, unknown>[]
}

// The dashboard logic lives in an inline script so we can reuse the
// battle-tested vanilla JS from the prototype without a full React rewrite.
// Data is passed in via window globals before the script runs.
export default function Dashboard({ userId, initialHabits, initialTodos, initialLogs }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const sb = createClient()

  useEffect(() => {
    // Expose Supabase client + initial data to the inline dashboard script
    ;(window as unknown as Record<string, unknown>).__sb = sb
    ;(window as unknown as Record<string, unknown>).__userId = userId
    ;(window as unknown as Record<string, unknown>).__initialHabits = initialHabits
    ;(window as unknown as Record<string, unknown>).__initialTodos = initialTodos
    ;(window as unknown as Record<string, unknown>).__initialLogs = initialLogs

    // Patch the chat function to use our real API route
    ;(window as unknown as Record<string, unknown>).__chatEndpoint = '/api/chat'

    // Register service worker for PWA / offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={frameRef} id="app-root" style={{ width: '100%', minHeight: '100vh' }}>
      <DashboardStyles />
      <DashboardHTML />
      <DashboardScript
        initialHabits={initialHabits}
        initialTodos={initialTodos}
        initialLogs={initialLogs}
      />
    </div>
  )
}

function DashboardStyles() {
  return (
    <style dangerouslySetInnerHTML={{ __html: `
@keyframes fadeUp{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#090909;--border:#181818;--ghost:#252525;
  --water:#4fc3f7;--workout:#d97706;--read:#4ade80;
  --sleep:#a78bfa;--work:#60a5fa;--teeth:#fffff0;
  --vitamin:#b57bee;--sprint:#16c784;--bread:#c8925a;
  --bad:#ef4444;--inspire:#fde68a;
  --work-mail:#60a5fa;--work-chat:#818cf8;--work-meet:#a78bfa;--work-ins:#fde68a;
  --W:356px;
}
body{
  background:var(--bg);color:#d0d0d0;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  min-height:100vh;display:flex;flex-direction:column;align-items:center;
  padding:18px 22px 88px;max-width:400px;margin:0 auto;
}
.header{width:100%;display:flex;flex-direction:column;align-items:center;gap:2px;margin-bottom:20px}
.wx-ico{font-size:20px;line-height:1;margin-bottom:2px}
.clock{font-size:52px;font-weight:200;letter-spacing:-2px;color:#f0f0f0;line-height:1}
.date{font-size:11px;color:#aaa;letter-spacing:.3px}
.div{width:100%;height:1px;background:var(--border);margin:10px 0}
.csec{width:100%;display:flex;flex-direction:column;align-items:center}
.t-wrap{display:flex;justify-content:center;width:100%;padding:7px 0;cursor:pointer}
.t-ico{font-size:28px;transition:color .2s;line-height:1}.t-ico.ghost{color:var(--ghost)}
.spawn{display:none;flex-direction:row;gap:16px;justify-content:center;align-items:flex-end;flex-wrap:wrap;padding:6px 0 2px;width:100%}
.spawn.open{display:flex;animation:fadeUp .22s ease forwards}
.icon-row{width:100%;display:flex;flex-direction:row;gap:16px;padding:8px 0;align-items:center;justify-content:center;flex-wrap:wrap}
.sh{display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;-webkit-user-select:none}
.sh-ico{font-size:26px;transition:color .15s;line-height:1}.sh-ico.ghost{color:var(--ghost)}
.ww{display:flex;flex-direction:column;align-items:center}
.ww-num{font-size:20px;font-weight:300;letter-spacing:-.5px;cursor:ew-resize;user-select:none;transition:color .15s;font-variant-numeric:tabular-nums;min-width:5ch;text-align:center;padding:2px 0}
.wc-wrap{display:none;width:100%;padding:5px 0 2px;cursor:pointer}
.wc-wrap.open{display:block;animation:fadeIn .18s ease forwards}
.tracker-row{width:100%;display:flex;flex-direction:column}
.tracker-main{display:flex;align-items:center;gap:6px;padding:8px 0;cursor:pointer;user-select:none;justify-content:center}
.t-icons{display:flex;gap:5px;align-items:center;flex-wrap:wrap;justify-content:center}
.t-unit{font-size:22px;cursor:pointer;line-height:1;transition:color .15s}.t-unit.ghost{color:var(--ghost)}
.io{display:none;position:fixed;top:0;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:400px;background:#070707;flex-direction:column;overflow-y:auto;z-index:100}
.io::-webkit-scrollbar{width:0}
.io.open{display:flex;animation:fadeIn .18s ease forwards}
.io-top{flex:1;min-height:60px;display:flex;flex-direction:column;align-items:center;padding:36px 22px 0;cursor:pointer}
.io-header{display:flex;flex-direction:column;align-items:center;gap:14px;margin-bottom:22px;width:100%;pointer-events:none}
.io-big-icon{font-size:56px;line-height:1}
.io-stats{display:flex;gap:0;width:100%;pointer-events:none}
.io-stat{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px}
.io-stat-v{font-size:22px;font-weight:200}
.io-stat-l{font-size:9px;color:#252525;letter-spacing:.8px;text-transform:uppercase}
.io-div{width:100%;height:1px;background:#141414;margin-bottom:18px;pointer-events:none}
.io-heatmap{width:100%;margin-bottom:6px;pointer-events:none}
.io-heatmap svg{width:100%;display:block;overflow:visible}
.io-heatmap-times{display:flex;justify-content:space-between;padding:8px 0 14px;pointer-events:none}
.io-ht{font-size:9px;color:#282828;letter-spacing:.3px}
.io-txt{font-size:12px;color:#305060;line-height:1.7;text-align:center;max-width:300px;pointer-events:none;padding-bottom:24px}
.io-tap{font-size:9px;color:#1a1a1a;letter-spacing:.8px;padding:20px 0;cursor:pointer}
.io-cal{width:100%;padding:18px 22px 80px;background:#070707;cursor:default}
.cal-scroll{max-height:200px;overflow-y:auto}
.cal-scroll::-webkit-scrollbar{width:0}
.cal-grid{display:grid;grid-template-columns:repeat(14,1fr);gap:3px}
.cal-cell{display:flex;align-items:center;justify-content:center;aspect-ratio:1}
.dot{width:10px;height:10px;border-radius:50%;border:1px solid #1e1e1e;background:transparent;transition:all .1s}
.dot.active{border:none}
.dot.today{box-shadow:0 0 0 1.5px #333}
.dot.future{opacity:0;pointer-events:none}
.overlay{display:none;position:fixed;top:0;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:400px;background:#060606;flex-direction:column;align-items:center;justify-content:center;z-index:200;padding:24px 20px}
.overlay.open{display:flex;animation:fadeIn .16s ease forwards}
.ov-title{font-size:10px;color:#252525;letter-spacing:1px;margin-bottom:10px}
.ov-range{display:flex;gap:6px;margin-bottom:10px}
.ov-rb{font-size:9px;color:#252525;background:#0f0f0f;border:1px solid #161616;border-radius:4px;padding:3px 8px;cursor:pointer;transition:color .15s}
.ov-rb:hover{color:#666}.ov-rb.on{color:#d0d0d0;border-color:#2a2a2a}
.ov-close{font-size:9px;color:#1e1e1e;margin-top:10px;cursor:pointer}
.ov-close:hover{color:#555}
.ctx-menu{display:none;position:fixed;background:#0d0d0d;border:1px solid #1a1a1a;border-radius:8px;overflow:hidden;z-index:300;min-width:160px}
.ctx-menu.open{display:block;animation:fadeIn .1s ease forwards}
.ctx-item{padding:11px 16px;font-size:12px;color:#888;cursor:pointer;transition:color .15s}
.ctx-item:hover{color:#aaa;background:#111}
.ctx-item.danger{color:#3a1a1a}
.ctx-item.danger:hover{color:#ef4444;background:#120808}
.nav-bar{position:fixed;bottom:0;left:50%;transform:translateX(-50%);width:100%;max-width:400px;background:#080808;border-top:1px solid var(--border);padding:10px 18px 18px;display:flex;align-items:center;z-index:50}
.nav-icons{width:100%;display:flex;justify-content:space-around;align-items:center}
.nav-icon{font-size:22px;color:#ccc;cursor:pointer;transition:color .15s;padding:4px 10px;user-select:none}
.nav-icon:hover{color:#fff}
.nav-note{width:100%;display:none;align-items:center;gap:8px}
.nav-note.open{display:flex}
.note-time{font-size:10px;color:#999;white-space:nowrap;font-variant-numeric:tabular-nums}
.note-inp{flex:1;background:transparent;border:none;outline:none;color:#888;font-size:12px;font-family:inherit}
.note-inp::placeholder{color:#161616}
.note-send{font-size:18px;color:#bbb;cursor:pointer;transition:color .15s}
.note-send:hover{color:var(--water)}
.note-close{font-size:18px;color:#bbb;cursor:pointer;transition:color .15s}
.note-close:hover{color:#fff}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
.panel{display:none;position:fixed;top:0;bottom:0;left:0;right:0;width:100%;max-width:400px;margin:0 auto;background:#060606;flex-direction:column;z-index:150;overflow:hidden}
.panel.open{display:flex;animation:slideUp .22s ease forwards}
.panel-head{display:flex;align-items:center;justify-content:space-between;padding:18px 20px 12px;border-bottom:1px solid #121212;flex-shrink:0}
.panel-title{font-size:11px;color:#bbb;letter-spacing:1px;text-transform:uppercase}
.panel-bottom{display:flex;align-items:center;gap:8px;padding:12px 20px 20px;border-top:1px solid #0e0e0e;flex-shrink:0;background:#060606}
.panel-inp{flex:1;background:transparent;border:none;outline:none;color:#888;font-size:13px;font-family:inherit}
.panel-inp::placeholder{color:#181818}
.panel-action{font-size:18px;color:#bbb;cursor:pointer;transition:color .15s}
.panel-action:hover{color:#fff}
.panel-close-x{font-size:18px;color:#bbb;cursor:pointer;transition:color .15s;margin-left:2px}
.panel-close-x:hover{color:#fff}
.todo-scroll{flex:1;overflow-y:auto;padding:0 20px}
.todo-scroll::-webkit-scrollbar{width:0}
.todo-sect-label{font-size:9px;color:#444;letter-spacing:.8px;text-transform:uppercase;padding:14px 0 6px}
.todo-item{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #0e0e0e;cursor:pointer;user-select:none}
.todo-cb{width:14px;height:14px;border:1px solid #222;border-radius:3px;flex-shrink:0;transition:all .15s}
.todo-cb.done{background:#1a1a1a;border-color:#1a1a1a}
.todo-text{flex:1;font-size:13px;color:#ccc;line-height:1.5}
.todo-text.done{color:#444;text-decoration:line-through;text-decoration-color:#555}
.hm-scroll{flex:1;overflow-y:auto;padding:0 20px 20px}
.hm-scroll::-webkit-scrollbar{width:0}
.hm-label{font-size:9px;color:#888;letter-spacing:.8px;text-transform:uppercase;margin-bottom:8px;display:block}
.hm-row{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}
.hm-input{background:#0c0c0c;border:1px solid #181818;border-radius:6px;color:#888;font-size:13px;font-family:inherit;padding:9px 12px;outline:none;width:100%;transition:border-color .15s}
.hm-input:focus{border-color:#2a2a2a;color:#888}
.hm-input::placeholder{color:#181818}
.hm-chips{display:flex;flex-wrap:wrap;gap:6px}
.hm-chip{font-size:11px;color:#555;border:1px solid #222;border-radius:20px;padding:5px 12px;cursor:pointer;transition:all .15s;background:#0a0a0a}
.hm-chip:hover{color:#888;border-color:#2a2a2a}
.hm-chip.sel{color:#d0d0d0;border-color:#333;background:#111}
.hm-icon-pick{display:grid;grid-template-columns:repeat(8,1fr);gap:4px;max-height:180px;overflow-y:auto;background:#0a0a0a;border:1px solid #141414;border-radius:8px;padding:8px}
.hm-icon-pick::-webkit-scrollbar{width:3px}
.hm-icon-pick::-webkit-scrollbar-thumb{background:#1a1a1a}
.hm-iopt{display:flex;align-items:center;justify-content:center;font-size:20px;padding:5px;border-radius:5px;cursor:pointer;color:#555;transition:all .15s}
.hm-iopt:hover{color:#888;background:#111}
.hm-iopt.sel{color:#d0d0d0;background:#141414}
.hm-search{background:#0c0c0c;border:1px solid #141414;border-radius:6px;color:#888;font-size:12px;font-family:inherit;padding:7px 10px;outline:none;width:100%;margin-bottom:8px;transition:border-color .15s}
.hm-search:focus{border-color:#222;color:#888}
.hm-search::placeholder{color:#181818}
.hm-preview{display:flex;align-items:center;justify-content:center;padding:16px;background:#080808;border:1px solid #141414;border-radius:10px;margin-bottom:14px;gap:12px;min-height:64px;flex-wrap:wrap;position:relative;width:100%;box-sizing:border-box}
.prev-ico{font-size:30px;line-height:1;transition:color .2s;cursor:pointer}
.prev-ico.ghost{color:#252525}
.prev-count{font-size:18px;font-weight:300;color:#555;min-width:28px;text-align:center;font-variant-numeric:tabular-nums}
.prev-btn{font-size:22px;color:#2a2a2a;cursor:pointer;padding:0 8px;user-select:none;transition:color .15s}
.prev-btn:hover{color:#888}
.hm-btn{width:100%;padding:12px;border-radius:8px;background:#111;border:1px solid #1e1e1e;color:#666;font-size:12px;cursor:pointer;transition:all .15s;font-family:inherit;margin-top:4px}
.hm-btn:hover{color:#888;border-color:#2a2a2a}
.hm-btn.primary{background:#141414;border-color:#2a2a2a;color:#555}
.hm-btn.primary:hover{border-color:#444;color:#aaa}
.hm-habit-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #0c0c0c;cursor:pointer}
.hm-habit-ico{font-size:20px;width:28px;text-align:center}
.hm-habit-name{flex:1;font-size:12px;color:#888}
.hm-habit-meta{font-size:9px;color:#555}
.chat-msgs{flex:1;overflow-y:auto;padding:16px 20px 0;display:flex;flex-direction:column}
.chat-msgs::-webkit-scrollbar{width:0}
.chat-bubble{max-width:80%;padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.6;margin-bottom:10px}
.chat-bubble.user{background:#0f1a24;color:#4fc3f7;align-self:flex-end;border-radius:12px 12px 2px 12px}
.chat-bubble.ai{background:#0d0d0d;color:#bbb;align-self:flex-start;border-radius:12px 12px 12px 2px;border:1px solid #1e1e1e}
.chat-inp{flex:1;background:#0c0c0c;border:1px solid #161616;border-radius:20px;padding:9px 14px;color:#888;font-size:13px;font-family:inherit;outline:none}
.chat-inp::placeholder{color:#181818}
.chat-inp:focus{border-color:#222}
.hm-ts-wrap{padding:20px 0 6px;position:relative}
.hm-ts-track{position:relative;height:2px;border-radius:1px;margin:14px 14px;cursor:pointer}
.hm-ts-fill{position:absolute;top:0;left:0;right:0;height:100%;border-radius:1px;pointer-events:none}
.hm-ts-dot{position:absolute;top:50%;transform:translate(-50%,-50%);width:24px;height:24px;border-radius:50%;background:#fff;cursor:grab;display:flex;align-items:center;justify-content:center;touch-action:none;z-index:2;box-shadow:0 1px 6px rgba(0,0,0,.5)}
.hm-ts-dot span{font-size:7px;color:#000;font-weight:700;user-select:none;line-height:1}
.hm-days{display:flex;justify-content:space-between;padding:10px 2px 4px}
.hm-day{font-size:11px;color:#fff;cursor:pointer;padding:4px 6px;user-select:none;transition:opacity .15s;font-weight:500}
.hm-day.inactive{opacity:0.18}
.hm-cdot{display:block;width:13px;height:13px;border-radius:50%;pointer-events:none;border:1.5px solid;background:transparent;box-sizing:border-box;transition:background .15s}
.hm-chip:has(.hm-cdot){padding:5px 7px}
#custom-own-rows{width:100%;display:flex;flex-direction:row;gap:16px;padding:8px 0;align-items:center;justify-content:center;flex-wrap:wrap}
#custom-own-rows:empty{display:none}
.io-dist{width:100%;pointer-events:none;padding-bottom:18px}
.io-dist-bar{width:100%;height:6px;border-radius:3px;overflow:hidden;display:flex;margin-bottom:8px}
.io-dist-seg{height:100%}
.io-dist-labels{display:flex;justify-content:space-between;padding:0 2px}
.io-dist-lbl{font-size:9px;color:#282828;display:flex;align-items:center;gap:4px}
.io-dist-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
.hm-row > .hm-label + .hm-chips,.hm-row > .hm-label + .hm-input{margin-top:0}
    ` }} />
  )
}

function DashboardHTML() {
  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' }).replace(/\//g,'.')

  return (
    <div dangerouslySetInnerHTML={{ __html: `
<div class="header">
  <i class="ph-duotone ph-cloud-rain wx-ico" id="wx-ico" style="color:#3b82f6;--ph-duotone-opacity:.3"></i>
  <div class="clock" id="clock">--:--</div>
  <div class="date">${dateStr}</div>
</div>
<div class="csec" id="sec-morning">
  <div class="t-wrap" onclick="triggerMorning()">
    <i class="ph-duotone ph-sun t-ico ghost" id="sun-ico" style="--ph-duotone-opacity:.18"></i>
  </div>
  <div class="spawn" id="morning-spawn">
    <div class="ww"><div class="ww-num" id="ww-num">--.-</div></div>
    <div class="sh" id="sh-bread"><i class="ph-duotone ph-bread sh-ico ghost" id="ico-bread" style="--ph-duotone-opacity:.18"></i></div>
    <div class="sh" id="sh-pill"><i class="ph-duotone ph-pill sh-ico ghost" id="ico-pill" style="--ph-duotone-opacity:.18"></i></div>
    <div class="sh" id="sh-ff"><i class="ph-duotone ph-fast-forward sh-ico ghost" id="ico-ff" style="--ph-duotone-opacity:.18"></i></div>
    <div class="sh" id="sh-teeth-am"><i class="ph-duotone ph-tooth sh-ico ghost" id="ico-teeth-am" style="--ph-duotone-opacity:.18"></i></div>
  </div>
  <div class="wc-wrap" id="wc-wrap" onclick="weightChartClick()">
    <svg id="wc-svg" preserveAspectRatio="none"></svg>
  </div>
  <div class="div"></div>
</div>
<div class="tracker-row" id="water-row">
  <div class="tracker-main" onclick="tapTracker(event,'water')">
    <div class="t-icons" id="drops-water"></div>
  </div>
</div>
<div class="div"></div>
<div class="csec" id="sec-workout">
  <div class="t-wrap" id="workout-trigger">
    <i class="ph-duotone ph-lightning t-ico ghost" id="ico-workout" style="font-size:30px;--ph-duotone-opacity:.18"></i>
  </div>
  <div class="spawn" id="workout-spawn">
    <div class="sh" id="sh-barbell"><i class="ph-duotone ph-barbell sh-ico ghost" id="ico-barbell" style="--ph-duotone-opacity:.18"></i></div>
    <div class="sh" id="sh-run"><i class="ph-duotone ph-sneaker-move sh-ico ghost" id="ico-run" style="--ph-duotone-opacity:.18"></i></div>
    <div class="sh" id="sh-yoga"><i class="ph-duotone ph-scales sh-ico ghost" id="ico-yoga" style="--ph-duotone-opacity:.18"></i></div>
  </div>
  <div class="div" style="margin-top:2px"></div>
</div>
<div class="icon-row" id="sec-positive">
  <div class="sh" id="sh-book"><i class="ph-duotone ph-book-open sh-ico ghost" id="ico-book" style="--ph-duotone-opacity:.18"></i></div>
  <div class="sh" id="sh-cross"><i class="ph-duotone ph-cross sh-ico ghost" id="ico-cross" style="--ph-duotone-opacity:.18"></i></div>
  <div class="sh" id="sh-avo"><i class="ph-duotone ph-avocado sh-ico ghost" id="ico-avo" style="--ph-duotone-opacity:.18"></i></div>
</div>
<div class="div" id="div-pos"></div>
<div class="icon-row" id="sec-bad">
  <div class="sh" id="sh-cookie"><i class="ph-duotone ph-cookie sh-ico ghost" id="ico-cookie" style="--ph-duotone-opacity:.18"></i></div>
  <div class="sh" id="sh-pizza"><i class="ph-duotone ph-pizza sh-ico ghost" id="ico-pizza" style="--ph-duotone-opacity:.18"></i></div>
  <div class="sh" id="sh-soda"><i class="ph-duotone ph-pint-glass sh-ico ghost" id="ico-soda" style="--ph-duotone-opacity:.18"></i></div>
  <div class="sh" id="sh-alc"><i class="ph-duotone ph-beer-stein sh-ico ghost" id="ico-alc" style="--ph-duotone-opacity:.18"></i></div>
  <div class="sh" id="sh-yt"><i class="ph-duotone ph-youtube-logo sh-ico ghost" id="ico-yt" style="--ph-duotone-opacity:.18"></i></div>
  <div class="sh" id="sh-tv"><i class="ph-duotone ph-screencast sh-ico ghost" id="ico-tv" style="--ph-duotone-opacity:.18"></i></div>
</div>
<div class="div" id="div-bad"></div>
<div id="custom-own-rows"></div>
<div class="csec" id="sec-work">
  <div class="t-wrap" id="sh-work">
    <i class="ph-duotone ph-briefcase t-ico ghost" id="ico-work" style="--ph-duotone-opacity:.18"></i>
  </div>
  <div class="spawn" id="work-spawn">
    <div style="width:100%;display:flex;flex-direction:column;gap:6px;align-items:center;padding:2px 0">
      <div id="work-counters" style="width:100%;display:flex;justify-content:space-around;align-items:center;padding:6px 0"></div>
      <div class="icon-row" style="padding:3px 0">
        <div class="sh" id="sh-inspire"><i class="ph-duotone ph-lightbulb-filament sh-ico ghost" id="ico-inspire" style="--ph-duotone-opacity:.18"></i></div>
        <div class="sh" id="sh-signout" onclick="endWork()"><i class="ph-duotone ph-sign-out sh-ico" id="ico-signout" style="--ph-duotone-opacity:.25;color:#fb5659"></i></div>
      </div>
    </div>
  </div>
  <div class="div" style="margin-top:2px"></div>
</div>
<div class="csec" id="sec-sleep">
  <div class="t-wrap" id="sh-sleep">
    <i class="ph-duotone ph-moon t-ico ghost" id="moon-ico" style="--ph-duotone-opacity:.18"></i>
  </div>
</div>
<div class="io" id="io">
  <div class="io-top" id="io-top" onclick="closeInsight()">
    <div class="io-header">
      <i class="io-big-icon ph-duotone" id="io-icon" style="--ph-duotone-opacity:.2"></i>
      <div class="io-stats" id="io-stats"></div>
    </div>
    <div class="io-div"></div>
    <div class="io-heatmap" id="io-heatmap">
      <svg id="time-svg" style="height:68px"></svg>
      <div class="io-heatmap-times" id="time-labels"></div>
    </div>
    <div class="io-dist" id="io-dist" style="display:none"></div>
    <div class="io-txt" id="io-txt"></div>
    <div class="io-tap">tap to close</div>
  </div>
  <div class="io-cal" onclick="e=>e.stopPropagation()">
    <div class="cal-scroll"><div class="cal-grid" id="cal-grid"></div></div>
  </div>
</div>
<div class="overlay" id="detail-overlay">
  <div class="ov-title">WEIGHT HISTORY</div>
  <div class="ov-range">
    <button class="ov-rb" onclick="setRange(30,this)">30d</button>
    <button class="ov-rb on" onclick="setRange(90,this)">90d</button>
    <button class="ov-rb" onclick="setRange(180,this)">180d</button>
    <button class="ov-rb" onclick="setRange(365,this)">1y</button>
  </div>
  <svg id="detail-svg" style="width:100%;max-width:356px" viewBox="0 0 356 220"></svg>
  <div class="ov-close" onclick="document.getElementById('detail-overlay').classList.remove('open')">tap to close</div>
</div>
<div class="ctx-menu" id="ctx-menu">
  <div class="ctx-item" onclick="ctxEdit()">Edit</div>
  <div class="ctx-item" id="ctx-undo" onclick="ctxUndo()">Mark as not done</div>
  <div class="ctx-item danger" onclick="ctxDelete()">Delete</div>
</div>
<div class="panel" id="todo-panel">
  <div class="panel-head"><span class="panel-title">Tasks</span></div>
  <div class="todo-scroll" id="todo-list"></div>
  <div class="panel-bottom">
    <input class="panel-inp" id="todo-inp" placeholder="add a task…" onkeydown="if(event.key==='Enter')addTodo()"/>
    <i class="ph ph-plus-circle panel-action" onclick="addTodo()"></i>
    <i class="ph ph-x panel-close-x" onclick="closePanel('todo-panel')"></i>
  </div>
</div>
<div class="panel" id="hm-panel">
  <div class="panel-head"><span class="panel-title" id="hm-panel-title">Habits</span></div>
  <div class="hm-scroll">
    <div id="hm-existing"></div>
    <div id="hm-form" style="display:none">
      <div id="hm-edit-warning" style="display:none;background:#120808;border:1px solid #2a1010;border-radius:6px;padding:9px 12px;margin:14px 0 2px">
        <span style="font-size:11px;color:#5a2525;line-height:1.5">This habit has tracked history. Changing its type or icon may make past data harder to interpret.</span>
      </div>
      <div class="hm-row"><span class="hm-label">Icon</span>
        <input class="hm-search" id="hm-ico-search" placeholder="search icons…" oninput="filterHmIcons()"/>
        <div class="hm-icon-pick" id="hm-icon-grid"></div>
      </div>
      <div class="hm-row"><span class="hm-label">Name</span>
        <input class="hm-input" id="hm-name" placeholder="e.g. cold-shower"/>
      </div>
      <div class="hm-row"><span class="hm-label">Description</span>
        <input class="hm-input" id="hm-desc" placeholder="what does this track?"/>
      </div>
      <div class="hm-row"><span class="hm-label">Color</span>
        <div class="hm-chips" id="hm-color-chips">
          <span class="hm-chip" data-v="#ef4444"><i class="hm-cdot" style="border-color:#ef4444"></i></span>
          <span class="hm-chip" data-v="#f97316"><i class="hm-cdot" style="border-color:#f97316"></i></span>
          <span class="hm-chip" data-v="#d97706"><i class="hm-cdot" style="border-color:#d97706"></i></span>
          <span class="hm-chip" data-v="#fde68a"><i class="hm-cdot" style="border-color:#fde68a"></i></span>
          <span class="hm-chip" data-v="#a3e635"><i class="hm-cdot" style="border-color:#a3e635"></i></span>
          <span class="hm-chip sel" data-v="#4ade80"><i class="hm-cdot" style="border-color:#4ade80"></i></span>
          <span class="hm-chip" data-v="#2dd4bf"><i class="hm-cdot" style="border-color:#2dd4bf"></i></span>
          <span class="hm-chip" data-v="#4fc3f7"><i class="hm-cdot" style="border-color:#4fc3f7"></i></span>
          <span class="hm-chip" data-v="#60a5fa"><i class="hm-cdot" style="border-color:#60a5fa"></i></span>
          <span class="hm-chip" data-v="#818cf8"><i class="hm-cdot" style="border-color:#818cf8"></i></span>
          <span class="hm-chip" data-v="#a78bfa"><i class="hm-cdot" style="border-color:#a78bfa"></i></span>
          <span class="hm-chip" data-v="#f472b6"><i class="hm-cdot" style="border-color:#f472b6"></i></span>
          <span class="hm-chip" data-v="#c8925a"><i class="hm-cdot" style="border-color:#c8925a"></i></span>
          <span class="hm-chip" data-v="custom">Custom</span>
        </div>
        <input id="hm-color-hex" class="hm-input" placeholder="e.g. #ff6b35" maxlength="7" style="display:none;margin-top:6px;font-family:monospace;letter-spacing:.05em"/>
      </div>
      <div class="hm-row"><span class="hm-label">Active time</span>
        <div class="hm-chips" id="hm-time-chips">
          <span class="hm-chip sel" data-v="all">All day</span>
          <span class="hm-chip" data-v="morning">Morning</span>
          <span class="hm-chip" data-v="afternoon">Afternoon</span>
          <span class="hm-chip" data-v="evening">Evening</span>
          <span class="hm-chip" data-v="custom">Custom</span>
        </div>
        <div id="hm-time-custom" style="display:none">
          <div class="hm-ts-wrap">
            <div class="hm-ts-track" id="hm-ts-track">
              <div class="hm-ts-fill" id="hm-ts-fill"></div>
              <div class="hm-ts-dot" id="hm-ts-s"><span id="hm-ts-sl">23</span></div>
              <div class="hm-ts-dot" id="hm-ts-e"><span id="hm-ts-el">07</span></div>
            </div>
          </div>
          <div class="hm-days" id="hm-days">
            <span class="hm-day" data-day="0">M</span><span class="hm-day" data-day="1">T</span>
            <span class="hm-day" data-day="2">W</span><span class="hm-day" data-day="3">T</span>
            <span class="hm-day" data-day="4">F</span><span class="hm-day" data-day="5">S</span>
            <span class="hm-day" data-day="6">S</span>
          </div>
        </div>
      </div>
      <div class="hm-row"><span class="hm-label">Type</span>
        <div class="hm-chips" id="hm-type-chips">
          <span class="hm-chip sel" data-v="toggle">Toggle</span>
          <span class="hm-chip" data-v="counter">Counter</span>
          <span class="hm-chip" data-v="tracker">Tracker</span>
          <span class="hm-chip" data-v="parent">Parent</span>
        </div>
        <div id="hm-target-row" style="display:none;flex-direction:row;align-items:center;gap:14px;margin-top:10px">
          <span class="prev-btn" onclick="if(hmTrackTarget>1){hmTrackTarget--;document.getElementById('hm-target-count').textContent=hmTrackTarget;updateHmPreview();}">−</span>
          <span id="hm-target-count" style="font-size:18px;font-weight:200;color:#555;min-width:20px;text-align:center;font-variant-numeric:tabular-nums">4</span>
          <span class="prev-btn" onclick="if(hmTrackTarget<12){hmTrackTarget++;document.getElementById('hm-target-count').textContent=hmTrackTarget;updateHmPreview();}">+</span>
        </div>
      </div>
      <div class="hm-row"><span class="hm-label">Category</span>
        <div class="hm-chips" id="hm-cat-chips">
          <span class="hm-chip sel" data-v="own-row">Own row</span>
          <span class="hm-chip" data-v="positive">Positive</span>
          <span class="hm-chip" data-v="bad">Bad habit</span>
          <span class="hm-chip" data-v="morning">Morning</span>
        </div>
      </div>
    </div>
  </div>
  <div id="hm-form-preview" style="display:none;flex-shrink:0;border-top:1px solid #0e0e0e;padding:12px 20px">
    <div class="hm-preview" id="hm-preview"></div>
  </div>
  <div class="panel-bottom" id="hm-panel-bottom"></div>
</div>
<div class="panel" id="chat-panel">
  <div class="panel-head"><span class="panel-title">Claude</span></div>
  <div class="chat-msgs" id="chat-msgs">
    <div class="chat-bubble ai">Hi! I can see your habits and can give you personalised insights. What's on your mind?</div>
  </div>
  <div class="panel-bottom">
    <input class="chat-inp" id="chat-inp" placeholder="ask me anything…" onkeydown="if(event.key==='Enter')sendChat()"/>
    <i class="ph ph-arrow-bend-down-left panel-action" onclick="sendChat()"></i>
    <i class="ph ph-x panel-close-x" onclick="closePanel('chat-panel')"></i>
  </div>
</div>
<div class="nav-bar">
  <div class="nav-icons" id="nav-icons">
    <i class="ph ph-chat-circle nav-icon" onclick="openPanel('chat-panel')"></i>
    <i class="ph ph-plus-circle nav-icon" onclick="openPanel('hm-panel')"></i>
    <i class="ph ph-check-square nav-icon" onclick="openPanel('todo-panel')"></i>
    <i class="ph ph-pencil nav-icon" onclick="toggleNote()"></i>
  </div>
  <div class="nav-note" id="nav-note-field">
    <span class="note-time" id="note-time">--:--</span>
    <input class="note-inp" id="note-inp" placeholder="note something…" onkeydown="if(event.key==='Enter')sendNote()"/>
    <i class="ph ph-arrow-bend-down-left note-send" onclick="sendNote()"></i>
    <i class="ph ph-x note-close" onclick="toggleNote()"></i>
  </div>
</div>
    ` }} />
  )
}

function DashboardScript({ initialHabits, initialTodos, initialLogs }: {
  initialHabits: Record<string, unknown>[]
  initialTodos: Record<string, unknown>[]
  initialLogs: Record<string, unknown>[]
}) {
  const data = JSON.stringify({ initialHabits, initialTodos, initialLogs })
  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web/src/regular/style.css" />
      <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web/src/duotone/style.css" />
      {/* Inline the full dashboard JS with server data pre-loaded */}
      <script dangerouslySetInnerHTML={{ __html: `
var __serverData = ${data};
var __customHabits = __serverData.initialHabits || [];
var __todos = __serverData.initialTodos || [];
var __todayLogs = __serverData.initialLogs || [];
      ` }} />
      <script src="/dashboard.js" defer />
    </>
  )
}
