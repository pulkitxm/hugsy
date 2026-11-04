import SwiftUI

#if SWIFT_PACKAGE
  import Hugsy
  import HugsyPreviewKit
#endif

struct StretchyHeaderPreview: View {
  let session: PreviewSession
  var body: some View {
    PreviewScaffold(session: session) {
      HugsyStretchyHeader(height: 250) {
        PreviewArtwork(colors: PreviewContent.still.colors)
      } content: {
        VStack(alignment: .leading, spacing: 20) {
          Text("The places\nin between.").font(.system(size: 30, weight: .medium)).tracking(-1)
          Text(
            "Some days ask for a slower pace. A different path. A little more room to notice what was here all along."
          )
          .font(.system(size: 14)).lineSpacing(5).foregroundStyle(.secondary)
          ForEach(0..<5) { _ in
            RoundedRectangle(cornerRadius: 8).fill(.primary.opacity(0.05)).frame(height: 55)
          }
        }.padding(24)
          #if os(iOS)
            .background(PreviewScrollDriver(offset: session.state == "pulled" ? -150 : 0))
          #endif
      }.clipShape(RoundedRectangle(cornerRadius: 28))
    }
  }
}
