import React from "react";

const SimpleParticleRing = ({ children, className = "" }) => {
  return (
    <div className={`relative ${className}`} style={{ overflow: 'hidden' }}>
      {/* Animated gradient background */}
      <div 
        style={{ 
          height: "100vh",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 0,
          background: "linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe)",
          backgroundSize: "400% 400%",
          animation: "gradientShift 15s ease infinite"
        }}
      />
      
      {/* Multiple floating particle layers */}
      <div 
        style={{ 
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.4) 0%, transparent 50%),
            radial-gradient(circle at 60% 70%, rgba(255, 200, 100, 0.3) 0%, transparent 40%),
            radial-gradient(circle at 10% 30%, rgba(100, 255, 200, 0.3) 0%, transparent 40%)
          `,
          animation: "float 20s ease-in-out infinite"
        }}
      />
      
      {/* Additional particle layer */}
      <div 
        style={{ 
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
          backgroundImage: `
            radial-gradient(circle at 70% 10%, rgba(255, 100, 200, 0.2) 0%, transparent 30%),
            radial-gradient(circle at 30% 90%, rgba(100, 200, 255, 0.2) 0%, transparent 30%),
            radial-gradient(circle at 90% 60%, rgba(200, 255, 100, 0.2) 0%, transparent 30%)
          `,
          animation: "float 25s ease-in-out infinite reverse"
        }}
      />
      
      {/* CSS Animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
          html, body {
            overflow: hidden !important;
            height: 100% !important;
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            25% { background-position: 100% 50%; }
            50% { background-position: 100% 100%; }
            75% { background-position: 0% 100%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float {
            0%, 100% { 
              transform: translateY(0px) rotate(0deg) scale(1); 
              opacity: 0.8;
            }
            25% { 
              transform: translateY(-15px) rotate(0.5deg) scale(1.05); 
              opacity: 1;
            }
            50% { 
              transform: translateY(-25px) rotate(1deg) scale(1.1); 
              opacity: 0.9;
            }
            75% { 
              transform: translateY(-10px) rotate(-0.5deg) scale(0.95); 
              opacity: 0.7;
            }
          }
        `
      }} />

      {/* Content overlay */}
      <div style={{ position: "relative", zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

export default SimpleParticleRing;
