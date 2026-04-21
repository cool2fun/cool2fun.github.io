'use client';

import Link from 'next/link';
import { categories } from '@/data/games';

interface HeaderProps {
  activeSlug?: string;
}

export default function Header({ activeSlug }: HeaderProps) {
  return (
    <header>
      <div className="header-inner">
        <Link href="/" className="logo" aria-label="Cool2Fun Home">
          <i className="fas fa-gamepad"></i>
          <span>Cool2Fun</span>
        </Link>
        <div className="search-wrap">
          <i className="fas fa-search"></i>
          <input id="searchInput" type="search" placeholder="Search games..." aria-label="Search games" />
        </div>
        <nav className="main-nav" aria-label="Game categories">
          <ul>
            {categories.map((cat) => (
              <li key={cat.name}>
                <Link href={cat.link} className={activeSlug === cat.name ? 'active' : ''}>
                  <i className={`fas ${cat.icon}`}></i> <span>{cat.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}