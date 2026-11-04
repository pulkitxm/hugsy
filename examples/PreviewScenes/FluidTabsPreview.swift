import SwiftUI

#if SWIFT_PACKAGE
  import Hugsy
  import HugsyPreviewKit
#endif

struct FluidTabsPreview: View {
  let session: PreviewSession
  private var selection: Binding<String> {
    Binding(
      get: { session.screen.label },
      set: { label in
        if let screen = session.definition.screens.first(where: { $0.label == label }) {
          session.show(screen: screen.id)
        }
      })
  }

  var body: some View {
    PreviewScaffold(session: session) {
      HugsyFluidTabs(
        tabs: session.definition.screens.map(\.label), selection: selection)
      PreviewArtwork(
        colors: session.screen.id == "following"
          ? PreviewContent.after.colors : PreviewContent.still.colors
      ).frame(height: 280).clipShape(RoundedRectangle(cornerRadius: 28))
      VStack(alignment: .leading, spacing: 8) {
        Text(session.screen.id == "saved" ? "Keep the good ones." : "A new perspective.")
          .font(.system(size: 25, weight: .medium)).tracking(-0.8)
        Text("Stories worth making a little room for.").font(.system(size: 12))
          .foregroundStyle(.secondary)
      }
    }
  }
}
