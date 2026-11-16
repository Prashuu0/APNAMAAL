import { memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

function MenuItemCard({ item, onAdd, onRemove, quantity = 0 }) {
	const [isAnimating, setIsAnimating] = useState(false)

	const handleAdd = () => {
		setIsAnimating(true)
		onAdd?.(item)
		setTimeout(() => setIsAnimating(false), 600)
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={{ scale: 1.02 }}
			className="relative overflow-hidden border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
		>
			<div className="flex gap-4">
				{item.image && (
					<div className="w-24 h-24 flex-shrink-0">
						<img 
							src={item.image} 
							alt={item.name}
							className="w-full h-full object-cover"
						/>
					</div>
				)}
				<div className="flex-1 p-4 min-w-0">
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<h4 className="font-bold text-gray-900 dark:text-white">{item.name}</h4>
								{item.veg !== undefined && (
									<div className={`w-4 h-4 rounded border-2 ${item.veg ? 'border-green-500' : 'border-red-500'}`}>
										{item.veg ? (
											<div className="w-full h-full flex items-center justify-center">
												<div className="w-2 h-2 rounded-full bg-green-500"></div>
											</div>
										) : (
											<div className="w-full h-full flex items-center justify-center">
												<div className="w-2 h-2 rounded-full bg-red-500"></div>
											</div>
										)}
									</div>
								)}
							</div>
							{item.description && (
								<p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
							)}
							{item.category && (
								<span className="inline-block mt-2 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
									{item.category}
								</span>
							)}
						</div>
						<div className="flex flex-col items-end gap-2">
							<p className="text-lg font-bold text-gray-900 dark:text-white">₹{item.price}</p>
							<AnimatePresence>
								{quantity > 0 ? (
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										exit={{ scale: 0 }}
										className="flex items-center gap-2"
									>
										<motion.button
											whileTap={{ scale: 0.9 }}
											onClick={() => onRemove?.(item)}
											className="w-8 h-8 rounded-full bg-red-500 dark:bg-red-600 text-white font-bold hover:bg-red-600 dark:hover:bg-red-700 flex items-center justify-center shadow-md"
										>
											−
										</motion.button>
										<span className="min-w-[2ch] text-center font-semibold text-gray-900 dark:text-white">{quantity}</span>
										<motion.button
											whileTap={{ scale: 0.9 }}
											onClick={handleAdd}
											className="w-8 h-8 rounded-full bg-red-500 dark:bg-red-600 text-white font-bold hover:bg-red-600 dark:hover:bg-red-700 flex items-center justify-center shadow-md"
										>
											+
										</motion.button>
									</motion.div>
								) : (
									<motion.button
										whileTap={{ scale: 0.95 }}
										onClick={handleAdd}
										className="px-4 py-2 rounded-lg bg-red-500 dark:bg-red-600 text-white font-semibold hover:bg-red-600 dark:hover:bg-red-700 shadow-md hover:shadow-lg transition-all"
									>
										Add
									</motion.button>
								)}
							</AnimatePresence>
						</div>
					</div>
				</div>
			</div>
			{isAnimating && (
				<motion.div
					initial={{ scale: 0, x: 0, y: 0 }}
					animate={{ 
						scale: [1, 1.2, 0.8],
						x: [0, 100, 100],
						y: [0, -50, -100],
						opacity: [1, 1, 0]
					}}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="absolute top-4 right-4 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold pointer-events-none z-10"
				>
					1
				</motion.div>
			)}
		</motion.div>
	)
}

export default memo(MenuItemCard)
