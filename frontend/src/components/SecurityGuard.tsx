import { useEffect } from "react";

export const SecurityGuard = () => {
  useEffect(() => {
    // 1. Bloqueio de Botão Direito
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. Bloqueio de Atalhos de Teclado (F12, Ctrl+Shift+I, etc)
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+I (Inspect)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        return false;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        return false;
      }
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        return false;
      }
    };

    // 3. Anti-Debugger (Loop de detecção)
    const devToolsChecker = setInterval(() => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // Se o console for aberto, podemos disparar um alerta ou limpar a tela
        // console.clear();
      }
    }, 1000);

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      clearInterval(devToolsChecker);
    };
  }, []);

  return null; // Componente invisível
};
