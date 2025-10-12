import React from 'react';

const ResultPage = ({ result, onRestart }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-10 max-w-4xl w-full animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-7xl mb-6 animate-bounce">🎉</div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            You are a {result.travelerType}!
          </h1>
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-100 to-blue-100 px-4 py-2 rounded-full">
            <span className="text-sm font-semibold text-green-700">
              Confidence: {(result.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 sm:p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📖</span> About You
          </h3>
          <p className="text-gray-700 leading-relaxed">{result.description}</p>
        </div>

        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span>✈️</span> Recommended Destinations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.recommendations.map((destination, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <p className="text-gray-800 font-medium">{destination}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button
            onClick={onRestart}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            Take Quiz Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultPage;
