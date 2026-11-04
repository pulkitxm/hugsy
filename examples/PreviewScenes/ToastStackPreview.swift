import SwiftUI

#if SWIFT_PACKAGE
  import Hugsy
  import HugsyPreviewKit
#endif

struct ToastStackPreview: View {
  let session: PreviewSession
  @State private var toasts = HugsyToasts()

  var body: some View {
    PreviewScaffold(session: session) {
      PreviewArtwork(colors: PreviewContent.still.colors).frame(height: 180)
        .clipShape(RoundedRectangle(cornerRadius: 28))
      Button {
        toasts.show("Saved to your collection")
      } label: {
        Text("Save a little inspiration").font(.system(size: 12, weight: .medium))
          .frame(maxWidth: .infinity).padding(16)
          .background(.primary.opacity(0.06), in: Capsule())
      }.buttonStyle(.plain)
      HugsyToastStack(toasts: toasts)
    }
    .onChange(of: session.state, initial: true) { _, state in
      for toast in toasts.items { toasts.dismiss(toast.id) }
      if state != "empty" {
        toasts.show("Saved to your collection", duration: .seconds(60))
      }
      if state == "stacked" {
        toasts.show("A new note, just for you", duration: .seconds(60))
      }
    }
  }
}
