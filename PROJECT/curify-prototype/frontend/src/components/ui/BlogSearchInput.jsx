import React, { useState, useRef } from 'react';
import { Search, X } from 'lucide-react';

export function BlogSearchInput({ value, onChange, onSearch, placeholder = "Search blog posts..." }) {
	const [isFocused, setIsFocused] = useState(false);
	const inputRef = useRef(null);

	const handleClear = () => {
		onChange({ target: { value: '' } });
		inputRef.current?.focus();
	};

	const handleKeyDown = (e) => {
		if (e.key === 'Enter') {
			onSearch?.(value);
		}
	};

	return (
		<div className="w-full max-w-2xl mx-auto relative group">
			{/* Animated glowing border wrapper */}
			<style>{`
				@keyframes glow-rotate {
					0% {
						transform: translate(-50%, -50%) rotate(0deg);
					}
					100% {
						transform: translate(-50%, -50%) rotate(360deg);
					}
				}

				.glow-border-wrapper {
					position: relative;
					border-radius: 12px;
				}

				.glow-border-wrapper::before {
					content: '';
					position: absolute;
					inset: -2px;
					border-radius: 14px;
					background: conic-gradient(
						from 0deg,
						#402fb5,
						#cf30aa,
						#402fb5
					);
					opacity: 0;
					transition: opacity 0.3s ease;
					z-index: 0;
				}

				.glow-border-wrapper:focus-within::before,
				.glow-border-wrapper:hover::before {
					opacity: 1;
					animation: glow-rotate 6s linear infinite;
				}

				.glow-inner {
					position: relative;
					background-color: #0a0a0a;
					border-radius: 10px;
					z-index: 1;
					border: 2px solid #1a1a2e;
					padding: 12px 16px;
					display: flex;
					align-items: center;
					gap: 12px;
					transition: all 0.3s ease;
				}

				.glow-border-wrapper:hover .glow-inner {
					border-color: #2a2a4e;
				}

				.glow-border-wrapper:focus-within .glow-inner {
					border-color: #2a2a4e;
				}

				.blog-search-input {
					background: transparent;
					border: none;
					outline: none;
					color: #ffffff;
					font-size: 14px;
					flex: 1;
					padding: 0;
				}

				.blog-search-input::placeholder {
					color: #888;
				}

				.search-icon {
					color: #666;
					transition: color 0.3s ease;
					flex-shrink: 0;
				}

				.glow-border-wrapper:focus-within .search-icon {
					color: #cf30aa;
				}

				.clear-btn {
					background: transparent;
					border: none;
					color: #666;
					cursor: pointer;
					padding: 4px;
					display: flex;
					align-items: center;
					justify-content: center;
					transition: all 0.2s ease;
					flex-shrink: 0;
				}

				.clear-btn:hover {
					color: #cf30aa;
				}

				/* Glow effect on focus */
				.glow-border-wrapper::after {
					content: '';
					position: absolute;
					inset: -1px;
					border-radius: 11px;
					background: radial-gradient(ellipse at center, rgba(207, 48, 170, 0.2) 0%, transparent 70%);
					opacity: 0;
					transition: opacity 0.3s ease;
					pointer-events: none;
					z-index: 0;
				}

				.glow-border-wrapper:focus-within::after {
					opacity: 1;
				}
			`}</style>

			<div className="glow-border-wrapper">
				<div className="glow-inner">
					<Search className="search-icon" size={18} />
					<input
						ref={inputRef}
						type="text"
						value={value}
						onChange={onChange}
						onKeyDown={handleKeyDown}
						onFocus={() => setIsFocused(true)}
						onBlur={() => setIsFocused(false)}
						placeholder={placeholder}
						className="blog-search-input"
					/>
					{value && (
						<button
							onClick={handleClear}
							className="clear-btn"
							type="button"
						>
							<X size={16} />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
