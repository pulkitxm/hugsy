import SwiftUI

#if SWIFT_PACKAGE
  import Hugsy
  import HugsyPreviewKit
#endif

struct MorphingSheetPreview: View {
  let session: PreviewSession
  private var position: Binding<HugsySheetPosition> {
    Binding(
      get: { session.state == "expanded" ? .expanded : .compact },
      set: { session.select(state: $0 == .expanded ? "expanded" : "compact") })
  }

  var body: some View {
    PreviewScaffold(session: session) {
      Spacer(minLength: 0)
      HugsyMorphingSheet(position: position, compactHeight: 215, expandedHeight: 430) { state in
        VStack(spacing: 20) {
          PreviewArtwork(colors: PreviewContent.after.colors)
            .frame(height: state == .compact ? 68 : 190)
            .clipShape(RoundedRectangle(cornerRadius: 22))
          HStack {
            VStack(alignment: .leading, spacing: 3) {
              Text("A quiet place").font(.system(size: 17, weight: .medium))
              Text("Sunday, somewhere").font(.system(size: 11)).foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "pause.fill").font(.system(size: 24))
          }
          if state == .expanded {
            Capsule().fill(.primary.opacity(0.12)).frame(height: 3)
            HStack(spacing: 45) {
              Image(systemName: "backward.end.fill")
              Image(systemName: "pause.circle.fill").font(.system(size: 45))
              Image(systemName: "forward.end.fill")
            }
          }
        }.padding(.horizontal, 24)
      }
    }
  }
}
