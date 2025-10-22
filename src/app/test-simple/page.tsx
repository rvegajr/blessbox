export default function TestSimplePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">BlessBox Test Page</h1>
        <p className="text-lg text-gray-600 mb-8">If you can see this, the application is working!</p>
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          ✅ Application is running successfully
        </div>
      </div>
    </div>
  )
}

