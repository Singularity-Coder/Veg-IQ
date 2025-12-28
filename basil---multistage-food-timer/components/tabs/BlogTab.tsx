
import React, { useState } from 'react';
import { BlogPost } from '../../types';
import { BLOG_POSTS } from '../../constants';

export const BlogTab: React.FC = () => {
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  if (activePost) {
    return (
      <div className="max-w-4xl mx-auto space-y-16 py-8 animate-luxe">
        <button onClick={() => setActivePost(null)} className="flex items-center gap-4 group text-[10px] tracking-[0.4em] font-bold uppercase text-slate-400 hover:text-[#1a1a1a] transition-colors">
          <svg className="w-5 h-5 group-hover:-translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 19l-7-7 7-7" /></svg>
          BACK TO ARCHIVES
        </button>
        <div className="space-y-12">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              {activePost.tags.map(tag => <span key={tag} className="px-3 py-1 bg-[#f3f1ed] text-[8px] tracking-[0.2em] font-bold text-slate-500 uppercase">{tag}</span>)}
            </div>
            <h1 className="text-5xl sm:text-7xl font-serif tracking-tighter leading-none">{activePost.title}</h1>
            <div className="flex justify-between items-center py-6 border-y border-[#e5e1da]">
              <span className="text-[10px] tracking-[0.3em] font-bold uppercase">{activePost.author}</span>
              <span className="text-[10px] tracking-[0.3em] font-bold text-slate-400">{activePost.date}</span>
            </div>
          </div>
          <div className="aspect-video overflow-hidden border border-[#e5e1da]">
            <img src={activePost.imageUrl} className="w-full h-full object-cover" alt={activePost.title} />
          </div>
          <div className="space-y-8 text-lg leading-relaxed font-light text-slate-700">
            {activePost.content.split('\n\n').map((para, i) => (
              <p key={i} className="first-letter:text-5xl first-letter:font-serif first-letter:float-left first-letter:mr-3 first-letter:mt-1">{para}</p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="animate-luxe space-y-24">
      <div className="text-left space-y-1">
        <h2 className="text-2xl sm:text-3xl font-serif tracking-tighter">The Journal</h2>
        <p className="text-[10px] text-slate-400">Scientific Perspectives on Vitality</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        {BLOG_POSTS.map(post => (
          <article key={post.id} className="group cursor-pointer space-y-8" onClick={() => setActivePost(post)}>
            <div className="aspect-[3/2] overflow-hidden border border-[#e5e1da]">
              <img src={post.imageUrl} className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:scale-105" alt={post.title} />
            </div>
            <div className="space-y-4">
              <div className="flex gap-4 text-[8px] tracking-[0.3em] font-bold text-slate-400 uppercase">
                <span>{post.date}</span><span>•</span><span>{post.author}</span>
              </div>
              <h3 className="text-2xl font-serif leading-tight group-hover:text-slate-600 transition-colors">{post.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-light">{post.excerpt}</p>
              <button className="text-[9px] tracking-[0.4em] font-bold border-b border-[#1a1a1a] pb-1 uppercase">Read Movement</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
