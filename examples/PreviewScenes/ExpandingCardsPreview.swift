import SwiftUI

#if SWIFT_PACKAGE
  import Hugsy
  import HugsyPreviewKit
#endif

struct ExpandingCardsPreview: View {
  let session: PreviewSession

  private var selection: Binding<String?> {
    Binding(
      get: {
        switch session.state {
        case "first-open": PreviewContent.still.id
        case "second-open": PreviewContent.after.id
        default: nil
        }
      },
      set: { value in
        session.select(
          state: value == nil
            ? "collapsed" : value == PreviewContent.still.id ? "first-open" : "second-open")
      })
  }

  var body: some View {
    PreviewScaffold(session: session) {
      HugsyExpandingCards(
        items: PreviewContent.stories, selection: selection, cardHeight: 182, expandedHeight: 430
      ) { story, expanded in
        ZStack(alignment: .bottomLeading) {
          PreviewArtwork(colors: story.colors)
          VStack(alignment: .leading, spacing: 10) {
            Text(story.subtitle).font(.system(size: 8, weight: .medium, design: .monospaced))
              .tracking(1)
            Text(story.title).font(.system(size: expanded ? 37 : 27, weight: .medium)).tracking(-1)
            if expanded {
              Text(
                "Some things are better when you give them a little more space. This is one of them."
              )
              .font(.system(size: 14)).lineSpacing(4).padding(.top, 16)
            }
          }.padding(24).foregroundStyle(
            story.id == "still" ? Color(red: 0.18, green: 0.16, blue: 0.13) : .white)
        }
      }
      if session.state == "collapsed" {
        HStack {
          Text("A FEW THINGS WE LOVE")
          Spacer()
          Text("02")
        }.font(.system(size: 8, design: .monospaced)).tracking(1).foregroundStyle(.secondary)
      }
    }
  }
}
