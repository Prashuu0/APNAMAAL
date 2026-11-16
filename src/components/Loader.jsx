import { motion } from 'framer-motion'

export default function Loader() {
	return (
		<div className="w-full flex items-center justify-center py-12">
			<div className="relative">
				<motion.div
					animate={{ rotate: 360 }}
					transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
					className="h-12 w-12 border-4 border-gray-200 dark:border-gray-700 border-t-red-500 dark:border-t-red-600 rounded-full"
				/>
				<motion.div
					animate={{ rotate: -360 }}
					transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
					className="absolute inset-0 h-12 w-12 border-4 border-transparent border-r-red-400 dark:border-r-red-500 rounded-full"
				/>
			</div>
		</div>
	)
}

export function SkeletonCard() {
	return (
		<div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm">
			<div className="h-48 w-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
			<div className="p-4 space-y-3">
				<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
				<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
				<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
			</div>
		</div>
	)
}

export function SkeletonMenuItem() {
	return (
		<div className="flex gap-4 p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
			<div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
			<div className="flex-1 space-y-2">
				<div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
				<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
				<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse" />
			</div>
			<div className="w-20 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
		</div>
	)
}
