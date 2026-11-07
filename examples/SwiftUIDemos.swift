import SwiftUI

#if SWIFT_PACKAGE
  import Hugsy
#endif

struct DemoCard: Identifiable, Hashable {
  let id: String
  let title: String
  let subtitle: String
  let hue: Double

  var gradient: LinearGradient {
    LinearGradient(
      colors: [
        Color(hue: hue, saturation: 0.42, brightness: 0.95),
        Color(hue: hue + 0.06, saturation: 0.62, brightness: 0.62),
      ], startPoint: .topLeading, endPoint: .bottomTrailing)
  }

  static let samples = [
    DemoCard(id: "dunes", title: "Quiet dunes", subtitle: "A slower weekend", hue: 0.07),
    DemoCard(id: "harbor", title: "Blue harbor", subtitle: "Notes from the coast", hue: 0.56),
    DemoCard(id: "grove", title: "Olive grove", subtitle: "Morning walks", hue: 0.24),
    DemoCard(id: "dusk", title: "City at dusk", subtitle: "After the last light", hue: 0.74),
    DemoCard(id: "bloom", title: "Late bloom", subtitle: "Small rituals", hue: 0.93),
  ]
}

struct DemoCardFace: View {
  let card: DemoCard
  var expanded = false

  var body: some View {
    ZStack(alignment: .bottomLeading) {
      card.gradient
      VStack(alignment: .leading, spacing: 8) {
        Text(card.subtitle.uppercased()).font(.caption2.monospaced()).opacity(0.8)
        Text(card.title).font(.system(size: expanded ? 36 : 28, weight: .semibold))
        if expanded {
          Text("Some things are better with a little more space. This is one of them.")
            .font(.body).opacity(0.9).padding(.top, 8)
        }
      }
      .foregroundStyle(.white)
      .padding(24)
    }
  }
}

struct SwipeDeckDemo: View {
  @State private var cards = DemoCard.samples

  var body: some View {
    VStack {
      HugsySwipeDeck(items: $cards) { card, progress in
        DemoCardFace(card: card)
          .overlay(alignment: .topLeading) {
            Text(progress >= 0 ? "LIKE" : "SKIP")
              .font(.title2.bold()).padding(10)
              .overlay(RoundedRectangle(cornerRadius: 10).stroke(lineWidth: 3))
              .foregroundStyle(.white).rotationEffect(.degrees(-12))
              .opacity(abs(progress)).padding(24)
          }
      }
      if cards.isEmpty {
        Button("Start over") { withAnimation { cards = DemoCard.samples } }
      }
    }
    .padding(24)
  }
}

struct ParallaxCarouselDemo: View {
  @State private var selection: DemoCard.ID?

  var body: some View {
    HugsyParallaxCarousel(items: DemoCard.samples, selection: $selection) { card in
      DemoCardFace(card: card)
    }
    .frame(height: 460)
  }
}

struct MorphingCapsuleDemo: View {
  @State private var phase = HugsyCapsulePhase.compact

  var body: some View {
    VStack(spacing: 32) {
      HugsyMorphingCapsule(phase: $phase) { phase in
        switch phase {
        case .compact:
          HStack {
            Image(systemName: "waveform").foregroundStyle(.orange)
            Spacer()
            Text("2:14").monospacedDigit()
          }.font(.footnote.weight(.semibold)).padding(.horizontal, 14)
        case .alert:
          HStack(spacing: 12) {
            Image(systemName: "checkmark.circle.fill").foregroundStyle(.green).font(.title2)
            Text("Upload complete").font(.subheadline.weight(.semibold))
            Spacer()
          }.padding(.horizontal, 16)
        case .expanded:
          VStack(alignment: .leading, spacing: 14) {
            HStack {
              RoundedRectangle(cornerRadius: 12).fill(.orange.gradient).frame(width: 52, height: 52)
              VStack(alignment: .leading) {
                Text("Morning mix").font(.headline)
                Text("Synthetic Artist").font(.subheadline).foregroundStyle(.secondary)
              }
              Spacer()
            }
            ProgressView(value: 0.38).tint(.white)
            HStack(spacing: 40) {
              Image(systemName: "backward.fill")
              Image(systemName: "pause.fill").font(.title)
              Image(systemName: "forward.fill")
            }.frame(maxWidth: .infinity)
          }.padding(24)
        }
      }
      Picker("Phase", selection: $phase) {
        ForEach(HugsyCapsulePhase.allCases, id: \.self) { phase in
          Text(phase.rawValue.capitalized).tag(phase)
        }
      }
      .pickerStyle(.segmented)
      .padding(.horizontal, 24)
      Spacer()
    }
    .padding(.top, 12)
  }
}

struct ExpandingCardsDemo: View {
  @State private var selection: DemoCard.ID?

  var body: some View {
    ScrollView {
      HugsyExpandingCards(items: Array(DemoCard.samples.prefix(3)), selection: $selection) {
        card, expanded in
        DemoCardFace(card: card, expanded: expanded)
      }
      .padding(20)
    }
  }
}

struct StackedCardsDemo: View {
  @State private var cards = Array(DemoCard.samples.prefix(3))

  var body: some View {
    HugsyStackedCards(items: $cards) { card in
      DemoCardFace(card: card, expanded: false)
    }
    .padding(20)
  }
}

struct RadialMenuDemo: View {
  @State private var expanded = false
  @State private var last = "Nothing yet"

  var body: some View {
    VStack {
      Text(last).font(.headline).padding(.top, 40)
      Spacer()
      HugsyRadialMenu(
        actions: [
          .init(id: "photo", title: "Add photo", symbol: "camera") { last = "Add photo" },
          .init(id: "note", title: "New note", symbol: "square.and.pencil") { last = "New note" },
          .init(id: "link", title: "Save link", symbol: "link") { last = "Save link" },
        ], isExpanded: $expanded)
    }
    .padding(.bottom, 32)
  }
}
