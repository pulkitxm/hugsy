import SwiftUI

#if SWIFT_PACKAGE
  import Hugsy
  import HugsyPreviewKit
#endif

struct RadialMenuPreview: View {
  let session: PreviewSession
  private var expanded: Binding<Bool> {
    Binding(
      get: { session.state == "expanded" },
      set: { session.select(state: $0 ? "expanded" : "collapsed") })
  }
  private var status: String {
    switch session.state {
    case "photo-selected": "Photo added"
    case "note-selected": "Note created"
    case "link-selected": "Link saved"
    default: "Made for a little more feeling."
    }
  }

  var body: some View {
    PreviewScaffold(session: session) {
      PreviewArtwork(colors: PreviewContent.after.colors).frame(height: 185)
        .clipShape(RoundedRectangle(cornerRadius: 28))
      Text(status).font(.system(size: 12)).foregroundStyle(.secondary)
      HugsyRadialMenu(
        actions: [
          .init(id: "photo", title: "Add photo", symbol: "camera") {
            session.select(state: "photo-selected")
          },
          .init(id: "note", title: "New note", symbol: "square.and.pencil") {
            session.select(state: "note-selected")
          },
          .init(id: "link", title: "Save link", symbol: "link") {
            session.select(state: "link-selected")
          },
        ], isExpanded: expanded
      ).tint(Color(red: 0.32, green: 0.29, blue: 0.49)).frame(maxWidth: .infinity)
    }
  }
}
