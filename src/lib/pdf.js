import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/* Zrzut elementu DOM do wielostronicowego PDF (A4 pionowo).
   Na czas zrzutu (onclone) wymuszamy układ JEDNOKOLUMNOWY na stałej
   szerokości — dzięki temu nic się nie ucina (sticky/2 kolumny znikają).
   Renderuje jako obraz → zachowuje polskie znaki i wygląd panelu. */
export async function elementToPDF(el, filename = 'raport.pdf') {
  if (!el) return
  try {
    await render(el, filename)
  } catch (err) {
    console.error('PDF error:', err)
    alert('Nie udało się wygenerować PDF: ' + err.message)
  }
}

async function render(el, filename) {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    windowWidth: 1200,
    onclone: (doc) => {
      const root = doc.querySelector('[data-pdf-root]')
      if (!root) return
      root.style.width = '1120px'
      root.style.maxWidth = 'none'
      root.style.display = 'block'      // grid → blok: kolumny układają się pionowo
      root.style.background = '#ffffff'
      root.querySelectorAll('[data-pdf-aside]').forEach((a) => {
        a.style.position = 'static'
        a.style.width = '100%'
        a.style.marginTop = '20px'
      })
    },
  })
  const img = canvas.toDataURL('image/jpeg', 0.92)

  const pdf = new jsPDF('p', 'mm', 'a4')
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 8
  const imgW = pageW - margin * 2
  const imgH = (canvas.height * imgW) / canvas.width
  const usableH = pageH - margin * 2

  let heightLeft = imgH
  let position = margin
  pdf.addImage(img, 'JPEG', margin, position, imgW, imgH)
  heightLeft -= usableH
  while (heightLeft > 0) {
    pdf.addPage()
    position = margin - (imgH - heightLeft)
    pdf.addImage(img, 'JPEG', margin, position, imgW, imgH)
    heightLeft -= usableH
  }
  pdf.save(filename)
}
